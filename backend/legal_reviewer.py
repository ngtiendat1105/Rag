"""
legal_reviewer.py - Tiện ích quét file Markdown tìm thẻ [ĐỐI CHIẾU] cho hệ thống RAG Pháp lý
Quét toàn bộ thư mục, tìm các vị trí chứa thẻ [ĐỐI CHIẾU] hoặc [ĐỐI CHIẾU SỐ ĐIỀU]
và xuất ra file checklist_ra_soat.csv để bộ phận Pháp chế đối chiếu.
"""
import os
import re
import csv
import logging
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass
from datetime import datetime

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@dataclass
class ReferenceFinding:
    """Kết quả tìm thấy một thẻ [ĐỐI CHIẾU]."""
    file_path: str                    # Đường dẫn file
    line_number: int                  # Số dòng (1-indexed)
    line_content: str                 # Nội dung dòng chứa thẻ
    reference_type: str               # Loại thẻ: "doi_chieu" hoặc "doi_chieu_so_dieu"
    context_before: str = ""          # Ngữ cảnh trước (2 dòng)
    context_after: str = ""           # Ngữ cảnh sau (2 dòng)
    document_name: str = ""           # Tên tài liệu
    severity: str = "medium"          # Mức độ nghiêm trọng
    notes: str = ""                   # Ghi chú thêm
    
    def to_dict(self) -> Dict[str, Any]:
        """Chuyển đổi thành dictionary."""
        return {
            "file_path": self.file_path,
            "document_name": self.document_name,
            "line_number": self.line_number,
            "reference_type": self.reference_type,
            "line_content": self.line_content,
            "context_before": self.context_before,
            "context_after": self.context_after,
            "severity": self.severity,
            "notes": self.notes,
            "created_at": datetime.now().isoformat()
        }


class LegalDocumentReviewer:
    """
    Review các tài liệu pháp lý để tìm thẻ [ĐỐI CHIẾU].
    """
    
    # Regex patterns để tìm thẻ [ĐỐI CHIẾU]
    REFERENCE_PATTERNS = {
        "doi_chieu": [
            r"\[ĐỐI CHIẾU\]",                    # [ĐỐI CHIẾU]
            r"\[CẦN ĐỐI CHIẾU\]",               # [CẦN ĐỐI CHIẾU]
            r"\[CHƯA XÁC MINH\]",               # [CHƯA XÁC MINH]
            r"\[KIỂM TRA LẠI\]",                # [KIỂM TRA LẠI]
            r"\[VERIFICATION NEEDED\]",         # Tiếng Anh
        ],
        "doi_chieu_so_dieu": [
            r"\[ĐỐI CHIẾU SỐ ĐIỀU\]",          # [ĐỐI CHIẾU SỐ ĐIỀU]
            r"\[CẦN XÁC MINH ĐIỀU\]",          # [CẦN XÁC MINH ĐIỀU]
            r"\[ARTICLE VERIFICATION\]",        # Tiếng Anh
        ]
    }
    
    # File extensions để quét
    SUPPORTED_EXTENSIONS = {'.md', '.markdown', '.txt', '.mdx'}
    
    def __init__(self, root_dir: str = "."):
        """
        Khởi tạo reviewer.
        
        Args:
            root_dir: Thư mục gốc để quét
        """
        self.root_dir = Path(root_dir).resolve()
        self.findings: List[ReferenceFinding] = []
        
    def scan_directory(
        self, 
        dir_path: Optional[str] = None,
        recursive: bool = True,
        exclude_dirs: List[str] = None
    ) -> List[ReferenceFinding]:
        """
        Quét thư mục để tìm thẻ [ĐỐI CHIẾU].
        
        Args:
            dir_path: Đường dẫn thư mục (None để dùng root_dir)
            recursive: Quét đệ quy
            exclude_dirs: Danh sách thư mục cần bỏ qua
            
        Returns:
            List các findings
        """
        if dir_path is None:
            dir_path = self.root_dir
        else:
            dir_path = Path(dir_path).resolve()
        
        if exclude_dirs is None:
            exclude_dirs = ['.git', '__pycache__', 'node_modules', '.venv']
        
        logger.info(f"🔍 Đang quét thư mục: {dir_path}")
        
        # Xóa findings cũ
        self.findings = []
        
        # Duyệt qua tất cả các file
        for root, dirs, files in os.walk(dir_path):
            # Bỏ qua các thư mục không cần thiết
            dirs[:] = [d for d in dirs if d not in exclude_dirs]
            
            for file in files:
                file_path = Path(root) / file
                
                # Kiểm tra extension
                if file_path.suffix.lower() not in self.SUPPORTED_EXTENSIONS:
                    continue
                
                # Quét file
                file_findings = self.scan_file(file_path)
                self.findings.extend(file_findings)
        
        logger.info(f"✅ Đã quét xong. Tìm thấy {len(self.findings)} thẻ [ĐỐI CHIẾU]")
        return self.findings
    
    def scan_file(self, file_path: Path) -> List[ReferenceFinding]:
        """
        Quét một file cụ thể để tìm thẻ [ĐỐI CHIẾU].
        
        Args:
            file_path: Đường dẫn đến file
            
        Returns:
            List các findings trong file
        """
        findings = []
        
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                lines = f.readlines()
            
            # Lấy tên tài liệu từ tên file
            doc_name = self._extract_document_name(file_path)
            
            for line_num, line in enumerate(lines, 1):
                # Kiểm tra từng pattern
                for ref_type, patterns in self.REFERENCE_PATTERNS.items():
                    for pattern in patterns:
                        if re.search(pattern, line, re.IGNORECASE):
                            # Tìm thấy thẻ
                            finding = self._create_finding(
                                file_path=file_path,
                                line_num=line_num,
                                line_content=line.rstrip('\n'),
                                ref_type=ref_type,
                                lines=lines,
                                doc_name=doc_name
                            )
                            findings.append(finding)
                            break  # Chỉ thêm một lần cho mỗi dòng
            
        except UnicodeDecodeError:
            # Thử với encoding khác
            try:
                with open(file_path, 'r', encoding='latin-1') as f:
                    lines = f.readlines()
                
                # Xử lý tương tự
                doc_name = self._extract_document_name(file_path)
                
                for line_num, line in enumerate(lines, 1):
                    for ref_type, patterns in self.REFERENCE_PATTERNS.items():
                        for pattern in patterns:
                            if re.search(pattern, line, re.IGNORECASE):
                                finding = self._create_finding(
                                    file_path=file_path,
                                    line_num=line_num,
                                    line_content=line.rstrip('\n'),
                                    ref_type=ref_type,
                                    lines=lines,
                                    doc_name=doc_name
                                )
                                findings.append(finding)
                                break
                                
            except Exception as e:
                logger.warning(f"Không thể đọc file {file_path}: {e}")
                
        except Exception as e:
            logger.warning(f"Lỗi khi quét file {file_path}: {e}")
        
        if findings:
            logger.info(f"  📄 {file_path.name}: Tìm thấy {len(findings)} thẻ")
        
        return findings
    
    def _extract_document_name(self, file_path: Path) -> str:
        """
        Trích xuất tên tài liệu từ đường dẫn file.
        
        Args:
            file_path: Đường dẫn file
            
        Returns:
            Tên tài liệu
        """
        # Loại bỏ extension
        name = file_path.stem
        
        # Ánh xạ tên file sang tên tài liệu
        name_mappings = {
            "01_Bo_luat_Lao_dong_2019": "Bộ luật Lao động 2019",
            "02_Luat_Bao_hiem_xa_hoi_2024": "Luật Bảo hiểm xã hội 2024",
            "03_Luat_Bao_hiem_y_te": "Luật Bảo hiểm y tế",
            "04_Luat_Viec_lam_2025": "Luật Việc làm 2025",
        }
        
        return name_mappings.get(name, name)
    
    def _create_finding(
        self,
        file_path: Path,
        line_num: int,
        line_content: str,
        ref_type: str,
        lines: List[str],
        doc_name: str
    ) -> ReferenceFinding:
        """
        Tạo ReferenceFinding từ thông tin tìm thấy.
        
        Args:
            file_path: Đường dẫn file
            line_num: Số dòng
            line_content: Nội dung dòng
            ref_type: Loại thẻ
            lines: Tất cả các dòng trong file
            doc_name: Tên tài liệu
            
        Returns:
            ReferenceFinding object
        """
        # Lấy ngữ cảnh trước và sau
        context_before = self._get_context(lines, line_num - 1, before_lines=2)
        context_after = self._get_context(lines, line_num - 1, after_lines=2)
        
        # Xác định severity dựa trên loại thẻ và nội dung
        severity = self._determine_severity(ref_type, line_content)
        
        # Tạo notes tự động
        notes = self._generate_notes(ref_type, line_content)
        
        return ReferenceFinding(
            file_path=str(file_path),
            line_number=line_num,
            line_content=line_content,
            reference_type=ref_type,
            context_before=context_before,
            context_after=context_after,
            document_name=doc_name,
            severity=severity,
            notes=notes
        )
    
    def _get_context(
        self, 
        lines: List[str], 
        current_index: int,
        before_lines: int = 2,
        after_lines: int = 2
    ) -> str:
        """
        Lấy ngữ cảnh xung quanh một dòng.
        
        Args:
            lines: List các dòng
            current_index: Index của dòng hiện tại
            before_lines: Số dòng trước
            after_lines: Số dòng sau
            
        Returns:
            String ngữ cảnh
        """
        start = max(0, current_index - before_lines)
        end = min(len(lines), current_index + after_lines + 1)
        
        context_lines = []
        for i in range(start, end):
            if i == current_index:
                context_lines.append(f"[{i+1}] >>> {lines[i].rstrip()}")
            else:
                context_lines.append(f"[{i+1}]     {lines[i].rstrip()}")
        
        return "\n".join(context_lines)
    
    def _determine_severity(self, ref_type: str, line_content: str) -> str:
        """
        Xác định mức độ nghiêm trọng dựa trên loại thẻ và nội dung.
        
        Args:
            ref_type: Loại thẻ
            line_content: Nội dung dòng
            
        Returns:
            "low", "medium", hoặc "high"
        """
        # [ĐỐI CHIẾU SỐ ĐIỀU] thường quan trọng hơn
        if ref_type == "doi_chieu_so_dieu":
            return "high"
        
        # Kiểm tra từ khóa trong nội dung
        high_severity_keywords = [
            "quan trọng", "bắt buộc", "bản gốc", "chính thức",
            "important", "mandatory", "original", "official"
        ]
        
        for keyword in high_severity_keywords:
            if keyword.lower() in line_content.lower():
                return "high"
        
        # Mặc định
        return "medium"
    
    def _generate_notes(self, ref_type: str, line_content: str) -> str:
        """
        Tạo ghi chú tự động dựa trên loại thẻ và nội dung.
        
        Args:
            ref_type: Loại thẻ
            line_content: Nội dung dòng
            
        Returns:
            Ghi chú
        """
        if ref_type == "doi_chieu_so_dieu":
            return "Cần đối chiếu với số điều luật chính thức trong văn bản gốc."
        elif "[CẦN XÁC MINH]" in line_content.upper():
            return "Thông tin cần được xác minh với nguồn chính thống."
        elif "[CHƯA XÁC MINH]" in line_content.upper():
            return "Thông tin chưa được xác minh đầy đủ."
        else:
            return "Cần kiểm tra lại với văn bản pháp luật gốc."
    
    def export_to_csv(
        self, 
        output_file: str = "checklist_ra_soat.csv",
        output_dir: str = "evaluation_results"
    ) -> str:
        """
        Xuất findings ra file CSV.
        
        Args:
            output_file: Tên file output
            output_dir: Thư mục output
            
        Returns:
            Đường dẫn đến file đã xuất
        """
        os.makedirs(output_dir, exist_ok=True)
        output_path = Path(output_dir) / output_file
        
        try:
            with open(output_path, 'w', newline='', encoding='utf-8') as f:
                writer = csv.writer(f)
                
                # Header
                writer.writerow([
                    "STT",
                    "Tên file",
                    "Tên tài liệu", 
                    "Số dòng",
                    "Loại thẻ",
                    "Nội dung dòng",
                    "Ngữ cảnh trước",
                    "Ngữ cảnh sau",
                    "Mức độ",
                    "Ghi chú",
                    "Ngày phát hiện"
                ])
                
                # Data rows
                for i, finding in enumerate(self.findings, 1):
                    writer.writerow([
                        i,
                        Path(finding.file_path).name,
                        finding.document_name,
                        finding.line_number,
                        finding.reference_type,
                        finding.line_content[:200],  # Giới hạn độ dài
                        finding.context_before.replace('\n', '\\n'),
                        finding.context_after.replace('\n', '\\n'),
                        finding.severity,
                        finding.notes,
                        datetime.now().strftime("%Y-%m-%d")
                    ])
            
            logger.info(f"✅ Đã xuất {len(self.findings)} findings ra {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"❌ Lỗi khi xuất CSV: {e}")
            raise
    
    def export_to_json(
        self, 
        output_file: str = "checklist_ra_soat.json",
        output_dir: str = "evaluation_results"
    ) -> str:
        """
        Xuất findings ra file JSON.
        
        Args:
            output_file: Tên file output
            output_dir: Thư mục output
            
        Returns:
            Đường dẫn đến file đã xuất
        """
        os.makedirs(output_dir, exist_ok=True)
        output_path = Path(output_dir) / output_file
        
        try:
            data = {
                "metadata": {
                    "total_findings": len(self.findings),
                    "scanned_at": datetime.now().isoformat(),
                    "by_type": {},
                    "by_severity": {},
                    "by_document": {}
                },
                "findings": [f.to_dict() for f in self.findings]
            }
            
            # Thống kê
            for finding in self.findings:
                data["metadata"]["by_type"][finding.reference_type] = \
                    data["metadata"]["by_type"].get(finding.reference_type, 0) + 1
                data["metadata"]["by_severity"][finding.severity] = \
                    data["metadata"]["by_severity"].get(finding.severity, 0) + 1
                data["metadata"]["by_document"][finding.document_name] = \
                    data["metadata"]["by_document"].get(finding.document_name, 0) + 1
            
            import json
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(data, f, ensure_ascii=False, indent=2)
            
            logger.info(f"✅ Đã xuất findings ra {output_path}")
            return str(output_path)
            
        except Exception as e:
            logger.error(f"❌ Lỗi khi xuất JSON: {e}")
            raise
    
    def generate_report(self) -> Dict[str, Any]:
        """
        Tạo báo cáo thống kê về findings.
        
        Returns:
            Dictionary chứa thống kê
        """
        if not self.findings:
            return {"message": "Không tìm thấy thẻ [ĐỐI CHIẾU] nào."}
        
        stats = {
            "total_findings": len(self.findings),
            "by_type": {},
            "by_severity": {},
            "by_document": {},
            "files_with_findings": set(),
            "most_common_document": "",
            "highest_severity": ""
        }
        
        for finding in self.findings:
            # Thống kê theo type
            stats["by_type"][finding.reference_type] = \
                stats["by_type"].get(finding.reference_type, 0) + 1
            
            # Thống kê theo severity
            stats["by_severity"][finding.severity] = \
                stats["by_severity"].get(finding.severity, 0) + 1
            
            # Thống kê theo document
            stats["by_document"][finding.document_name] = \
                stats["by_document"].get(finding.document_name, 0) + 1
            
            # Files với findings
            stats["files_with_findings"].add(Path(finding.file_path).name)
        
        # Tìm document phổ biến nhất
        if stats["by_document"]:
            stats["most_common_document"] = max(
                stats["by_document"].items(), 
                key=lambda x: x[1]
            )[0]
        
        # Tìm severity cao nhất
        severity_order = {"high": 3, "medium": 2, "low": 1}
        if stats["by_severity"]:
            stats["highest_severity"] = max(
                stats["by_severity"].items(),
                key=lambda x: severity_order.get(x[0], 0)
            )[0]
        
        stats["files_with_findings"] = list(stats["files_with_findings"])
        
        return stats
    
    def print_summary(self):
        """In báo cáo tóm tắt ra console."""
        stats = self.generate_report()
        
        print("\n" + "="*60)
        print("📋 BÁO CÁO RÀ SOÁT THẺ [ĐỐI CHIẾU]")
        print("="*60)
        
        print(f"\n📊 Tổng quan:")
        print(f"   • Tổng số thẻ tìm thấy: {stats.get('total_findings', 0)}")
        print(f"   • Số file có thẻ: {len(stats.get('files_with_findings', []))}")
        
        if stats.get('by_type'):
            print(f"\n📈 Phân loại theo loại thẻ:")
            for ref_type, count in stats['by_type'].items():
                print(f"   • {ref_type}: {count}")
        
        if stats.get('by_severity'):
            print(f"\n⚠️  Phân loại theo mức độ:")
            for severity, count in stats['by_severity'].items():
                print(f"   • {severity}: {count}")
        
        if stats.get('by_document'):
            print(f"\n📄 Phân loại theo tài liệu:")
            for doc, count in list(stats['by_document'].items())[:5]:  # Hiển thị 5 cái đầu
                print(f"   • {doc}: {count}")
        
        print(f"\n🎯 Tài liệu cần chú ý nhất: {stats.get('most_common_document', 'N/A')}")
        print(f"🔴 Mức độ cao nhất: {stats.get('highest_severity', 'N/A')}")
        
        print("\n" + "="*60)
        print("✅ Hoàn thành rà soát. Vui lòng đối chiếu với CSDL chính thức.")


def scan_and_export(
    root_dir: str = ".",
    output_dir: str = "evaluation_results",
    export_formats: List[str] = None
) -> Dict[str, str]:
    """
    Hàm tiện ích: Quét thư mục và xuất kết quả.
    
    Args:
        root_dir: Thư mục gốc để quét
        output_dir: Thư mục output
        export_formats: Danh sách định dạng xuất ["csv", "json"]
        
    Returns:
        Dictionary với đường dẫn đến các file đã xuất
    """
    if export_formats is None:
        export_formats = ["csv", "json"]
    
    # Khởi tạo reviewer
    reviewer = LegalDocumentReviewer(root_dir)
    
    # Quét thư mục
    print(f"🔍 Đang quét thư mục: {root_dir}")
    findings = reviewer.scan_directory()
    
    if not findings:
        print("✅ Không tìm thấy thẻ [ĐỐI CHIẾU] nào.")
        return {}
    
    # Xuất kết quả
    result_files = {}
    
    if "csv" in export_formats:
        csv_path = reviewer.export_to_csv(output_dir=output_dir)
        result_files["csv"] = csv_path
    
    if "json" in export_formats:
        json_path = reviewer.export_to_json(output_dir=output_dir)
        result_files["json"] = json_path
    
    # In báo cáo
    reviewer.print_summary()
    
    return result_files


if __name__ == "__main__":
    """Test reviewer với thư mục hiện tại."""
    print("🧪 Testing Legal Document Reviewer...")
    print("=" * 60)
    
    try:
        # Tạo một file test với thẻ [ĐỐI CHIẾU]
        test_file = "test_reference.md"
        test_content = """# Test Document

## Section 1
Điều 15: Người lao động được nghỉ phép năm [ĐỐI CHIẾU]

## Section 2  
Theo quy định tại Điều 25 [ĐỐI CHIẾU SỐ ĐIỀU], thời gian thử việc tối đa là 60 ngày.

## Section 3
Mức lương tối thiểu cần được xác minh [CẦN ĐỐI CHIẾU] với văn bản mới nhất.

## Section 4
Đây là thông tin bình thường không có thẻ đối chiếu.
"""
        
        with open(test_file, 'w', encoding='utf-8') as f:
            f.write(test_content)
        
        print(f"📄 Đã tạo file test: {test_file}")
        
        # Quét thư mục
        reviewer = LegalDocumentReviewer(".")
        findings = reviewer.scan_directory()
        
        print(f"\n✅ Tìm thấy {len(findings)} thẻ [ĐỐI CHIẾU]")
        
        if findings:
            print("\n📝 Chi tiết findings:")
            for i, finding in enumerate(findings[:3], 1):  # Hiển thị 3 cái đầu
                print(f"\n--- Finding {i} ---")
                print(f"File: {Path(finding.file_path).name}")
                print(f"Document: {finding.document_name}")
                print(f"Line {finding.line_number}: {finding.line_content[:50]}...")
                print(f"Type: {finding.reference_type}")
                print(f"Severity: {finding.severity}")
        
        # Xuất ra CSV
        csv_path = reviewer.export_to_csv()
        print(f"\n📁 Đã xuất CSV: {csv_path}")
        
        # Tạo báo cáo
        print("\n📊 Báo cáo thống kê:")
        stats = reviewer.generate_report()
        print(f"   Total: {stats['total_findings']}")
        print(f"   By type: {stats['by_type']}")
        print(f"   By severity: {stats['by_severity']}")
        
        # Xóa file test
        os.remove(test_file)
        print(f"\n🗑️  Đã xóa file test: {test_file}")
        
        print("\n" + "=" * 60)
        print("✅ Legal reviewer test completed successfully")
        
    except Exception as e:
        print(f"\n❌ Error during test: {e}")
        import traceback
        traceback.print_exc()