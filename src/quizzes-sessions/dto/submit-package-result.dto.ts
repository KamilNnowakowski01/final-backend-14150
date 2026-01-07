/**
 * Result of package submission.
 */
export class SubmitPackageResultDto {
  packageId: string;
  correctCount: number;
  total: number;
  scorePercentage: number;
}
