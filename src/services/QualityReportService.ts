
import { stringify } from 'csv-stringify/sync';
import fs from 'fs/promises';
import path from 'path';
import logger from '../utils/logger';

export interface IQualityReportLog {
    Timestamp: string;
    TableName: string;
    RecordIdentifier: string;
    ChangeType: 'new' | 'updated' | 'deleted' | 'unchanged';
    Status: 'PASSED' | 'FAILED' | 'SKIPPED_DUPLICATE' | 'SKIPPED_UNCHANGED' | 'DELETED';
    Details: string;
    ValidationsApplied?: string;
    TransformationsApplied?: string;
    FullRecordData?: string;
}

class QualityReportService {
    private logEntries: IQualityReportLog[] = [];

    public addEntry(entry: IQualityReportLog): void {
        this.logEntries.push(entry);
    }

    public async generateReport(outputDir: string, fileName: string): Promise<void> {
        if (this.logEntries.length === 0) {
            logger.warn('[ReportService] Không có dữ liệu để tạo báo cáo.');
            return;
        }

        const reportPath = path.join(outputDir, fileName);

        try {
            const csvData = stringify(this.logEntries, {
                header: true,
                columns: [
                    { key: 'Timestamp', header: 'Timestamp' },
                    { key: 'TableName', header: 'TableName' },
                    { key: 'RecordIdentifier', header: 'RecordIdentifier' },
                    { key: 'ChangeType', header: 'ChangeType' },
                    { key: 'Status', header: 'Status' },
                    { key: 'Details', header: 'Details' },
                    { key: 'ValidationsApplied', header: 'ValidationsApplied' },
                    { key: 'TransformationsApplied', header: 'TransformationsApplied' },
                    { key: 'FullRecordData', header: 'FullRecordData' },
                ]
            });
            
            await fs.mkdir(outputDir, { recursive: true });
            await fs.writeFile(reportPath, csvData);
            logger.info(`✅ Đã xuất báo cáo chất lượng dữ liệu tại: ${reportPath}`);

        } catch (err) {
            logger.error('❌ Lỗi khi ghi báo cáo chất lượng dữ liệu:', err);
        }
    }

    public clear(): void {
        this.logEntries = [];
    }
}

// Export a singleton instance
export const qualityReportService = new QualityReportService();
