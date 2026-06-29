from datetime import timedelta

from temporalio import workflow
from temporalio.common import RetryPolicy


@workflow.defn
class ProteinWorkflow:
    @workflow.run
    async def run(self, job_id: int) -> str:
        retry_policy = RetryPolicy(
            maximum_attempts=3,
            maximum_interval=timedelta(seconds=10),
            # non_retryable_error_types=[] todo: add invalid API key
        )

        return await workflow.execute_activity(
            "visualize_protein",
            job_id,
            schedule_to_close_timeout=timedelta(seconds=10),
            retry_policy=retry_policy,
        )
