from fastapi import APIRouter, UploadFile, File, HTTPException, Depends, Response
from auth import get_current_user
import boto3, os, uuid
from dotenv import load_dotenv
from database import db
from cryptography.hazmat.primitives.ciphers import Cipher, algorithms, modes
from cryptography.hazmat.backends import default_backend
from datetime import datetime
import fitz
import google.generativeai as genai
import requests

from reportlab.lib.pagesizes import A4
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer
from reportlab.lib.units import inch
from io import BytesIO

# === Gemini Setup ===
load_dotenv()

router = APIRouter(prefix="/upload", tags=["File Uploads"])

# === AWS Clients ===
s3 = boto3.client(
    "s3",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)

kms = boto3.client(
    "kms",
    aws_access_key_id=os.getenv("AWS_ACCESS_KEY_ID"),
    aws_secret_access_key=os.getenv("AWS_SECRET_ACCESS_KEY"),
    region_name=os.getenv("AWS_REGION")
)

BUCKET_NAME = os.getenv("S3_BUCKET_NAME")
KMS_KEY_ID = os.getenv("AWS_KMS_KEY_ID")  # KMS key ARN or ID


# === Helper: AES-GCM encryption ===
def encrypt_file_with_kms(file_bytes: bytes):
    data_key = kms.generate_data_key(KeyId=KMS_KEY_ID, KeySpec="AES_256")
    plaintext_key = data_key["Plaintext"]
    encrypted_key = data_key["CiphertextBlob"]

    iv = os.urandom(12)
    encryptor = Cipher(
        algorithms.AES(plaintext_key),
        modes.GCM(iv),
        backend=default_backend()
    ).encryptor()

    ciphertext = encryptor.update(file_bytes) + encryptor.finalize()
    tag = encryptor.tag
    del plaintext_key

    return ciphertext, encrypted_key, iv, tag


# === Helper: AES-GCM decryption ===
def decrypt_file_with_kms(encrypted_data, encrypted_key_hex, iv_hex, tag_hex):
    # Convert hex to bytes
    encrypted_key = bytes.fromhex(encrypted_key_hex)
    iv = bytes.fromhex(iv_hex)
    tag = bytes.fromhex(tag_hex)

    # Decrypt the data key using KMS
    response = kms.decrypt(CiphertextBlob=encrypted_key)
    plaintext_key = response["Plaintext"]

    # Decrypt file using AES-GCM
    decryptor = Cipher(
        algorithms.AES(plaintext_key),
        modes.GCM(iv, tag),
        backend=default_backend()
    ).decryptor()

    decrypted_data = decryptor.update(encrypted_data) + decryptor.finalize()
    return decrypted_data


# === Upload File (Encrypt + Store) ===
@router.post("/file")
async def upload_file(
    file: UploadFile = File(...),
    current_user: dict = Depends(get_current_user)
):
    try:
        file_extension = os.path.splitext(file.filename)[1]
        unique_filename = f"{uuid.uuid4()}{file_extension}"

        file_bytes = await file.read()

        # Encrypt file
        encrypted_data, encrypted_key, iv, tag = encrypt_file_with_kms(file_bytes)

        # Metadata for decryption
        metadata = {
            "kmskey": encrypted_key.hex(),
            "iv": iv.hex(),
            "tag": tag.hex(),
            "uploader": current_user["email"]
        }

        # Upload to S3
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=unique_filename,
            Body=encrypted_data,
            ContentType=file.content_type,
            Metadata=metadata,
            ServerSideEncryption="aws:kms",
            SSEKMSKeyId=KMS_KEY_ID
        )
        

        file_url = f"https://{BUCKET_NAME}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{unique_filename}"
                # === Store file metadata in MongoDB ===
        await db.files.insert_one({
            "file_id": str(uuid.uuid4()),
            "original_name": file.filename,
            "s3_key": unique_filename,
            "uploaded_by": current_user["email"],
            "upload_time": datetime.utcnow(),
            "content_type": file.content_type,
            "kms_encryption": {
                "kms_key_id": KMS_KEY_ID,
                "encrypted_key": encrypted_key.hex(),
                "iv": iv.hex(),
                "tag": tag.hex()
            },
            "file_url": file_url
        })

        return {
            "message": "File encrypted and uploaded successfully",
            "file_url": file_url,
            "filename": unique_filename,
            "uploader": current_user["email"]
        }
        

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")


# === Download File (Decrypt + Return) ===
@router.get("/file/{filename}")
async def download_file(filename: str, current_user: dict = Depends(get_current_user)):
    try:
        # Get file object + metadata
        obj = s3.get_object(Bucket=BUCKET_NAME, Key=filename)
        encrypted_data = obj["Body"].read()
        metadata = obj["Metadata"]

        # Decrypt file using stored metadata
        decrypted_data = decrypt_file_with_kms(
            encrypted_data,
            metadata["kmskey"],
            metadata["iv"],
            metadata["tag"]
        )

        return Response(
            content=decrypted_data,
            media_type=obj["ContentType"],
            headers={
                "Content-Disposition": f"attachment; filename={filename}",
                "x-uploader": metadata.get("uploader", "unknown")
            },
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Decryption failed: {str(e)}")




@router.get("/my-reports")
async def get_user_reports(current_user: dict = Depends(get_current_user)):
    try:
        reports = await db.files.find({"uploaded_by": current_user["email"]}).to_list(None)
        for r in reports:
            r["_id"] = str(r["_id"])  # Convert ObjectId for JSON serialization
        return {"reports": reports}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reports: {str(e)}")



genai.configure(api_key=os.getenv("GEMINI_API_KEY"))

# === Summarization Helpers ===

def extract_text_from_pdf_bytes(pdf_bytes):
    try:
        doc = fitz.open(stream=pdf_bytes, filetype="pdf")
        text = ""
        for page in doc:
            text += page.get_text("text") + "\n"
        doc.close()
        return text.strip()
    except Exception as e:
        print("⚠️ Error extracting text:", e)
        return None


def summarize_single_pdf(text, filename):
    model = genai.GenerativeModel("gemini-2.5-flash")
    prompt = f"""
    Summarize this medical PDF into structured points.

    OUTPUT FORMAT:
    - Document: {filename}
    - Patient Snapshot (if found):
      • Age, Sex, Visit Dates
    - Key Observations:
      • ...
    - Major Findings:
      • ...
    - Suggested Follow-Ups:
      • ...
    - 2–3 Line Summary

    PDF CONTENT:
    {text}
    """
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"⚠️ Error generating summary: {e}"


def summarize_all_pdfs(text):
    model = genai.GenerativeModel("gemini-2.5-flash")
    prompt = f"""
    You are an expert medical data summarizer.

    TASK:
    Summarize ALL below PDF content into a unified report.

    OUTPUT:
    1) Combined Patient Overview
    2) Key Metrics & Trends
    3) Highlighted Findings Across Docs
    4) Combined Insights
    5) Data-Based Recommendations
    6) Final 3-line Summary

    CONTENT START:
    {text}
    """
    try:
        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        return f"⚠️ Error generating final summary: {e}"


# === New Summarization Endpoint ===
@router.post("/summarize")
async def summarize_uploaded_pdfs(current_user: dict = Depends(get_current_user)):
    """
    Fetches all uploaded PDFs for the current user,
    decrypts them using KMS, extracts text, and summarizes via Gemini.
    """
    try:
        files = await db.files.find({"uploaded_by": current_user["email"]}).to_list(None)
        if not files:
            raise HTTPException(status_code=404, detail="No uploaded files found for user.")

        per_doc_summaries = []
        combined_text = ""

        for f in files:
            filename = f.get("original_name", "unknown.pdf")
            file_url = f.get("file_url")
            kms_info = f.get("kms_encryption", {})

            if not file_url or not kms_info:
                continue

            # Download encrypted file
            try:
                s3_obj = s3.get_object(Bucket=BUCKET_NAME, Key=f["s3_key"])
                encrypted_data = s3_obj["Body"].read()
            except Exception as e:
                print(f"❌ Failed to fetch {filename} from S3: {e}")
                continue


            # Decrypt the file using KMS
            decrypted_data = decrypt_file_with_kms(
                encrypted_data,
                kms_info["encrypted_key"],
                kms_info["iv"],
                kms_info["tag"]
            )

            # Extract text
            text = extract_text_from_pdf_bytes(decrypted_data)
            if not text:
                continue

            combined_text += f"\n\n--- {filename} ---\n{text}"

            # Generate per-document summary
            summary = summarize_single_pdf(text, filename)
            per_doc_summaries.append({
                "filename": filename,
                "summary": summary
            })

        # Generate combined summary
        combined_summary = summarize_all_pdfs(combined_text)

        # Optionally: Save combined summary back to Mongo
        await db.summary_reports.insert_one({
            "user": current_user["email"],
            "summaries": per_doc_summaries,
            "combined_summary": combined_summary
        })

                # === Generate summary PDF ===
        pdf_bytes = create_summary_pdf(per_doc_summaries, combined_summary)
        pdf_filename = f"summary_{uuid.uuid4().hex}.pdf"

        # Optionally upload to S3 for persistence
        s3.put_object(
            Bucket=BUCKET_NAME,
            Key=pdf_filename,
            Body=pdf_bytes,
            ContentType="application/pdf",
            Metadata={"uploader": current_user["email"]},
        )

        summary_url = f"https://{BUCKET_NAME}.s3.{os.getenv('AWS_REGION')}.amazonaws.com/{pdf_filename}"

        # Save in DB
        await db.summary_reports.insert_one({
            "user": current_user["email"],
            "summaries": per_doc_summaries,
            "combined_summary": combined_summary,
            "summary_pdf_url": summary_url,
            "created_at": datetime.utcnow()
        })

        return Response(
    content=pdf_bytes,
    media_type="application/pdf",
    headers={"Content-Disposition": "attachment; filename=OneHealth_Summary.pdf"}
)



    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Summarization failed: {str(e)}")



def create_summary_pdf(per_doc_summaries, combined_summary):
    buffer = BytesIO()
    doc = SimpleDocTemplate(buffer, pagesize=A4, title="OneHealth Summary Report")
    styles = getSampleStyleSheet()
    story = []

    title_style = ParagraphStyle(
        'TitleStyle',
        parent=styles['Heading1'],
        fontSize=18,
        leading=22,
        spaceAfter=20,
    )

    header_style = ParagraphStyle(
        'HeaderStyle',
        parent=styles['Heading2'],
        fontSize=14,
        textColor='#2E86C1',
        spaceAfter=10,
    )

    body_style = ParagraphStyle(
        'BodyStyle',
        parent=styles['BodyText'],
        fontSize=11,
        leading=15,
        spaceAfter=10,
    )

    # Document Title
    story.append(Paragraph("OneHealth Medical Summary Report", title_style))
    story.append(Spacer(1, 0.3 * inch))

    # Per-document summaries
    for doc_summary in per_doc_summaries:
        story.append(Paragraph(f"📄 {doc_summary['filename']}", header_style))
        story.append(Paragraph(doc_summary['summary'].replace("\n", "<br/>"), body_style))
        story.append(Spacer(1, 0.2 * inch))

    story.append(Spacer(1, 0.3 * inch))
    story.append(Paragraph("🩺 Combined Insights", header_style))
    story.append(Paragraph(combined_summary.replace("\n", "<br/>"), body_style))

    doc.build(story)
    buffer.seek(0)
    return buffer.getvalue()
