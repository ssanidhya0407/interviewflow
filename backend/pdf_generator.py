from datetime import datetime
from io import BytesIO
from pathlib import Path
from typing import Any, Dict, List, Optional

from reportlab.lib import colors
from reportlab.lib.enums import TA_LEFT
from reportlab.lib.pagesizes import letter
from reportlab.lib.styles import ParagraphStyle, getSampleStyleSheet
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from reportlab.platypus import (
    Flowable,
    HRFlowable,
    Image,
    PageBreak,
    Paragraph,
    SimpleDocTemplate,
    Spacer,
    Table,
    TableStyle,
)
from reportlab.lib.utils import ImageReader

PAGE_BG = colors.HexColor("#0b0b0e")
CARD_BG = colors.HexColor("#101015")
BORDER = colors.HexColor("#23232d")
TEXT = colors.HexColor("#f5f5f7")
MUTED = colors.HexColor("#9a9aa5")
BLUE = colors.HexColor("#2f80ed")
PINK = colors.HexColor("#ff0a78")
LIME = colors.HexColor("#b6ff00")
CYAN = colors.HexColor("#23e9de")

RING_CONFIG = [
    ("Communication", PINK),
    ("Technical", LIME),
    ("Problem Solving", CYAN),
    ("Culture Fit", colors.HexColor("#ffa31a")),
]

WORDMARK_PATH = Path(__file__).resolve().parents[1] / "frontend" / "public" / "wordmark.png"


class Card(Flowable):
    def __init__(self, width: float, height: float):
        super().__init__()
        self.width = width
        self.height = height

    def wrap(self, *_):
        return self.width, self.height

    def draw(self):
        self.canv.saveState()
        self.canv.setFillColor(CARD_BG)
        self.canv.setStrokeColor(BORDER)
        self.canv.roundRect(0, 0, self.width, self.height, 12, fill=1, stroke=1)
        self.canv.restoreState()


class ClusteredRings(Flowable):
    def __init__(self, values: list[int], size: float = 120):
        super().__init__()
        self.values = values[:4]
        self.size = size
        self.width = size
        self.height = size

    def wrap(self, *_):
        return self.width, self.height

    def draw(self):
        c = self.canv
        cx = self.size / 2
        cy = self.size / 2

        radii = [self.size * 0.42, self.size * 0.32, self.size * 0.22, self.size * 0.12]
        stroke = self.size * 0.10

        for idx, value in enumerate(self.values):
            radius = radii[idx]
            _, color = RING_CONFIG[idx]
            progress = max(0, min(100, value)) / 100.0

            c.setLineWidth(stroke)
            c.setStrokeColor(colors.Color(color.red, color.green, color.blue, alpha=0.28))
            c.circle(cx, cy, radius, stroke=1, fill=0)

            c.setLineCap(1)
            c.setStrokeColor(color)
            c.setLineWidth(stroke)
            start = 90
            extent = -360 * progress
            c.arc(cx - radius, cy - radius, cx + radius, cy + radius, startAng=start, extent=extent)


class IndividualRings(Flowable):
    def __init__(self, values: list[int], width: float = 300, height: float = 70):
        super().__init__()
        self.values = values[:4]
        self.width = width
        self.height = height

    def wrap(self, *_):
        return self.width, self.height

    def draw(self):
        c = self.canv
        ring_size = 30
        radius = 11
        stroke = 6
        gap = self.width / 4

        for idx, value in enumerate(self.values):
            label, color = RING_CONFIG[idx]
            progress = max(0, min(100, value)) / 100.0

            x = idx * gap + 4
            y = self.height - 34
            cx = x + (ring_size / 2)
            cy = y + (ring_size / 2)

            c.setLineWidth(stroke)
            c.setStrokeColor(colors.Color(color.red, color.green, color.blue, alpha=0.28))
            c.circle(cx, cy, radius, stroke=1, fill=0)

            c.setLineCap(1)
            c.setStrokeColor(color)
            c.arc(cx - radius, cy - radius, cx + radius, cy + radius, startAng=90, extent=-360 * progress)

            c.setFillColor(TEXT)
            c.setFont("Helvetica-Bold", 8)
            c.drawString(x + ring_size + 6, y + 14, f"{label}")
            c.setFillColor(MUTED)
            c.setFont("Helvetica", 8)
            c.drawString(x + ring_size + 6, y + 3, f"{int(value)}%")


def _score_color(score: int):
    if score >= 70:
        return colors.HexColor("#22c55e")
    if score >= 50:
        return colors.HexColor("#f59e0b")
    return colors.HexColor("#ef4444")


def _page_bg(canv: canvas.Canvas, doc: Any):
    canv.saveState()
    canv.setFillColor(PAGE_BG)
    canv.rect(0, 0, letter[0], letter[1], fill=1, stroke=0)

    footer_y = 14
    if WORDMARK_PATH.exists():
        try:
            mark = ImageReader(str(WORDMARK_PATH))
            iw, ih = mark.getSize()
            target_w = 94
            target_h = target_w * (ih / iw) if iw else 16
            x = (letter[0] - target_w) / 2
            canv.drawImage(mark, x, footer_y, width=target_w, height=target_h, mask="auto", preserveAspectRatio=True)
        except Exception:
            canv.setFillColor(TEXT)
            canv.setFont("Helvetica-Bold", 9)
            canv.drawCentredString(letter[0] / 2, footer_y + 7, "InterviewFlow")
    else:
        canv.setFillColor(TEXT)
        canv.setFont("Helvetica-Bold", 9)
        canv.drawCentredString(letter[0] / 2, footer_y + 7, "InterviewFlow")

    canv.setFillColor(MUTED)
    canv.setFont("Helvetica", 8)
    canv.drawRightString(letter[0] - 36, 20, f"Generated {datetime.now().strftime('%b %d, %Y')}")
    canv.restoreState()


def generate_pdf_report(
    session_id: str,
    role: str,
    experience_level: str,
    score: int,
    summary: str,
    strengths: List[str],
    improvements: List[str],
    communication_score: int = 0,
    technical_score: int = 0,
    problem_solving_score: int = 0,
    culture_fit_score: int = 0,
    improvement_tips: Optional[List[str]] = None,
    transcript: Optional[List[Dict[str, Any]]] = None,
    voice_metrics: Optional[Dict[str, Any]] = None,
) -> bytes:
    buffer = BytesIO()
    doc = SimpleDocTemplate(
        buffer,
        pagesize=letter,
        topMargin=0.6 * inch,
        bottomMargin=0.6 * inch,
        leftMargin=0.55 * inch,
        rightMargin=0.55 * inch,
    )

    styles = getSampleStyleSheet()
    brand = ParagraphStyle("brand", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=22, textColor=TEXT, leading=24, spaceAfter=2)
    title = ParagraphStyle("title", parent=styles["Heading1"], fontName="Helvetica-Bold", fontSize=24, textColor=TEXT, leading=28, spaceAfter=6)
    h2 = ParagraphStyle("h2", parent=styles["Heading2"], fontName="Helvetica-Bold", fontSize=13, textColor=TEXT, leading=16, spaceBefore=8, spaceAfter=6)
    body = ParagraphStyle("body", parent=styles["BodyText"], fontName="Helvetica", fontSize=10.2, textColor=TEXT, leading=14)
    muted = ParagraphStyle("muted", parent=styles["BodyText"], fontName="Helvetica", fontSize=9, textColor=MUTED, leading=12)

    ring_values = [communication_score, technical_score, problem_solving_score, culture_fit_score]

    story: list[Any] = []

    # Starter cover page
    story.append(Spacer(1, 2.0 * inch))
    if WORDMARK_PATH.exists():
        try:
            cover = Image(str(WORDMARK_PATH))
            cover._restrictSize(4.2 * inch, 1.0 * inch)
            cover.hAlign = "CENTER"
            story.append(cover)
        except Exception:
            story.append(Paragraph("InterviewFlow", brand))
    else:
        story.append(Paragraph("InterviewFlow", brand))

    story.append(Spacer(1, 0.45 * inch))
    story.append(Paragraph("InterviewFlow · Performance Report", title))
    story.append(Paragraph(f"{role} · {experience_level}", body))
    story.append(Paragraph(f"Session {session_id[:8]}", muted))
    story.append(Spacer(1, 0.25 * inch))
    story.append(Paragraph(f"Overall Score <font color='{_score_color(score)}'><b>{score}/100</b></font>", body))
    story.append(PageBreak())

    story.append(Paragraph("InterviewFlow · Performance Report", brand))
    story.append(Paragraph(f"{role} · {experience_level}", title))
    story.append(Paragraph(f"Session {session_id[:8]} · Overall Score <font color='{_score_color(score)}'>{score}/100</font>", body))
    story.append(Spacer(1, 10))

    story.append(Card(doc.width, 145))
    story.append(Spacer(1, -133))

    top_grid = Table(
        [
            [
                ClusteredRings(ring_values, size=110),
                Paragraph("<b>Executive Summary</b><br/>" + summary, body),
            ]
        ],
        colWidths=[1.8 * inch, doc.width - 1.8 * inch - 14],
    )
    top_grid.setStyle(
        TableStyle(
            [
                ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
                ("VALIGN", (0, 0), (-1, -1), "TOP"),
                ("LEFTPADDING", (0, 0), (-1, -1), 8),
                ("RIGHTPADDING", (0, 0), (-1, -1), 8),
                ("TOPPADDING", (0, 0), (-1, -1), 10),
                ("BOTTOMPADDING", (0, 0), (-1, -1), 10),
            ]
        )
    )
    story.append(top_grid)
    story.append(Spacer(1, 8))

    story.append(Card(doc.width, 88))
    story.append(Spacer(1, -70))
    story.append(Paragraph("<b>Dimension Rings</b>", body))
    story.append(Spacer(1, 4))
    story.append(IndividualRings(ring_values, width=doc.width - 20, height=52))
    story.append(Spacer(1, 14))

    story.append(Spacer(1, 10))

    story.append(Paragraph("Strengths", h2))
    for item in strengths[:8]:
        story.append(Paragraph(f"<font color='#22c55e'>●</font> {item}", body))

    story.append(Spacer(1, 8))
    story.append(Paragraph("Improvements", h2))
    for item in improvements[:8]:
        story.append(Paragraph(f"<font color='#f59e0b'>●</font> {item}", body))

    if improvement_tips:
        story.append(Spacer(1, 8))
        story.append(Paragraph("Action Plan", h2))
        for idx, tip in enumerate(improvement_tips[:8], 1):
            story.append(Paragraph(f"{idx}. {tip}", body))

    if voice_metrics:
        story.append(PageBreak())
        story.append(Paragraph("Speaking Analysis", title))
        vm_rows = [
            ["Pace", voice_metrics.get("pace_rating", "-")],
            ["Words / Minute", str(voice_metrics.get("words_per_minute", 0))],
            ["Filler Words", str(voice_metrics.get("filler_word_count", 0))],
            ["Confidence", f"{voice_metrics.get('confidence_score', 0)}%"],
        ]
        vm_t = Table(vm_rows, colWidths=[2.2 * inch, 2.2 * inch])
        vm_t.setStyle(
            TableStyle(
                [
                    ("BACKGROUND", (0, 0), (-1, -1), CARD_BG),
                    ("GRID", (0, 0), (-1, -1), 0.5, BORDER),
                    ("TEXTCOLOR", (0, 0), (-1, -1), TEXT),
                    ("FONTNAME", (0, 0), (-1, -1), "Helvetica"),
                    ("FONTSIZE", (0, 0), (-1, -1), 10),
                    ("PADDING", (0, 0), (-1, -1), 8),
                ]
            )
        )
        story.append(vm_t)

        feedback = voice_metrics.get("feedback") or []
        if feedback:
            story.append(Spacer(1, 10))
            story.append(Paragraph("Voice Feedback", h2))
            for item in feedback[:8]:
                story.append(Paragraph(f"• {item}", body))

    if transcript:
        story.append(PageBreak())
        story.append(Paragraph("Interview Transcript", title))
        story.append(HRFlowable(width="100%", color=BORDER, thickness=1))
        story.append(Spacer(1, 8))
        shown = 0
        for msg in transcript:
            role_name = msg.get("role", "user")
            if role_name == "system":
                continue
            prefix = "You" if role_name == "user" else "Interviewer"
            content = msg.get("content", "")
            story.append(Paragraph(f"<b>{prefix}:</b> {content}", body))
            story.append(Spacer(1, 5))
            shown += 1
            if shown >= 24:
                story.append(Paragraph("<i>Transcript truncated in PDF for readability.</i>", muted))
                break

    doc.build(story, onFirstPage=_page_bg, onLaterPages=_page_bg)
    pdf_bytes = buffer.getvalue()
    buffer.close()
    return pdf_bytes
