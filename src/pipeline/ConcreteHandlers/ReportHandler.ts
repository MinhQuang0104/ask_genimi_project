
import { AppDataSource } from '../../config/database/typeormConfig';
import { qualityReportService, IQualityReportLog } from '../../services/QualityReportService';
import { Handler, PipelineContext } from '../Handler';

export class ReportHandler extends Handler {
    async handle(context: PipelineContext): Promise<void> {
        
        const {
            tableName,
            entity,
            rawData,
            changeType = 'new',
            isValid = true,
            isSkipped = false,
            errors = [],
            validationsApplied = [],
            transformationsApplied = []
        } = context;

        if (changeType === 'unchanged') {
            await super.handle(context);
            return;
        }

        let status: IQualityReportLog['Status'] = 'PASSED';
        let details = 'Successfully processed.';

        if (!isValid) {
            status = 'FAILED';
            details = errors.join('; ');
        } else if (isSkipped) {
            status = 'SKIPPED_DUPLICATE';
            details = 'Record was skipped as a duplicate within the same batch.';
        } else if (changeType === 'deleted' && isValid) { // isValid can be false for deletes if entity creation fails
            status = 'DELETED';
            details = 'Record was successfully marked for deletion.';
        }

        let recordIdentifier = 'N/A';
        const recordSource = entity || rawData; // Use entity if available, otherwise fallback to rawData

        if (recordSource && tableName) {
            try {
                const metadata = AppDataSource.getMetadata(tableName);
                const primaryColumns = metadata.primaryColumns.map(col => col.propertyName);
                if (primaryColumns.length > 0) {
                   recordIdentifier = primaryColumns.map(pk => `${pk}=${(recordSource as any)[pk]}`).join(', ');
                }
            } catch (e) {
                recordIdentifier = 'Error getting identifier';
            }
        }
        
        qualityReportService.addEntry({
            Timestamp: new Date().toISOString(),
            TableName: tableName || 'Unknown',
            RecordIdentifier: recordIdentifier,
            ChangeType: changeType,
            Status: status,
            Details: details,
            ValidationsApplied: validationsApplied.join('; ') || 'None',
            TransformationsApplied: transformationsApplied.join('; ') || 'None',
            FullRecordData: JSON.stringify(recordSource),
        });

        await super.handle(context);
    }
}
