import { IValidationStrategy } from '../strategies/interfaces/IValidationStrategy';

export interface IRuleMetadata {
    strategy: IValidationStrategy;
    args: any[];
}