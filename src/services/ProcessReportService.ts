
import * as fs from 'fs';
import * as path from 'path';
import { stringify } from 'csv-stringify/sync';
import { IMergeLog, MergeService } from '../core/services/MergeService';
import { Writable } from 'stream';

export interface IProcessingFailure {
    timestamp: string;
    sourceStream: string;
    rawMessage: string;
    error: string;
}

export class ProcessReportService {
    public static failures: IProcessingFailure[] = [];

    public static addFailure(sourceStream: string, rawMessage: string, error: Error) {
        this.failures.push({
            timestamp: new Date().toISOString(),
            sourceStream,
            rawMessage,
            error: error.message,
        });
    }

    public static generateAndLogReport(logger: any, sentCount: number, reportDir: string) {
        const receivedCount = MergeService.mergeLogs.length;
        const failureCount = this.failures.length;

        const successCount = receivedCount; // Assuming every log in MergeService is a success in terms of processing
        const newRecords = MergeService.mergeLogs.filter(log => log.Match_Type === 'NEW').length;
        const exactMatches = MergeService.mergeLogs.filter(log => log.Match_Type === 'EXACT').length;
        const fuzzyMatches = MergeService.mergeLogs.filter(log => log.Match_Type === 'FUZZY').length;

        // --- Log Summary Table to Console ---
        logger.info('--- PROCESSING SUMMARY ---');
        const summary = [
            { Metric: 'Messages Sent (from send.ts)', Count: sentCount },
            { Metric: 'Messages Received (by receive.ts)', Count: receivedCount + failureCount },
            { ' ': '----------------------------------', Count: '---' },
            { Metric: ' -> Processed Successfully', Count: successCount },
            { Metric: ' -> Processing Failed', Count: failureCount },
            { ' ': '----------------------------------', Count: '---' },
            { Metric: 'Breakdown of Success:', Count: ''},
            { Metric: ' - New Records Created', Count: newRecords },
            { Metric: ' - Merged (Exact Match)', Count: exactMatches },
            { Metric: ' - Merged (Fuzzy Match)', Count: fuzzyMatches },
        ];
        console.table(summary);
        
        // --- Generate Detailed Reports ---
        if (!fs.existsSync(reportDir)) {
            fs.mkdirSync(reportDir, { recursive: true });
        }

        // 1. Merge Report (already created, but we centralize logic here)
        const mergeReportPath = path.join(reportDir, "MERGE_REPORT_DETAILED.csv");
        try {
            if (MergeService.mergeLogs.length > 0) {
                const csvData = stringify(MergeService.mergeLogs, {
                    header: true,
                    columns: Object.keys(MergeService.mergeLogs[0])
                });
                fs.writeFileSync(mergeReportPath, csvData);
                logger.info(`✅ Detailed Merge Report saved to: ${mergeReportPath}`);
            }
        } catch (err) {
            logger.error(`❌ Error writing Merge Report: ${err}`);
        }

        // 2. Failure Report
        const failureReportPath = path.join(reportDir, "PROCESS_FAILURE_REPORT.csv");
        try {
            if (this.failures.length > 0) {
                const csvData = stringify(this.failures, { header: true });
                fs.writeFileSync(failureReportPath, csvData);
                logger.info(`✅ Processing Failure Report saved to: ${failureReportPath}`);
            } else {
                logger.info('✅ No processing failures recorded.');
            }
        } catch (err) {
            logger.error(`❌ Error writing Failure Report: ${err}`);
        }
    }
}
