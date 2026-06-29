import asyncio

from temporalio import workflow
from temporalio.client import Client
from temporalio.worker import Worker

with workflow.unsafe.imports_passed_through():
    from app import create_app
    from workflows.activities import ProteinActivities
    from workflows.workflows import ProteinWorkflow

# The worker is a separate process from Flask, so it has no app context by
# default. Build one once and push it for the worker's lifetime so activities
# can use db.session and current_app.
app = create_app()
app.app_context().push()


async def main():
    client = await Client.connect("localhost:7233")
    worker = Worker(
        client,
        task_queue="protein-fold-queue",
        workflows=[ProteinWorkflow],
        activities=[ProteinActivities().visualize_protein],
    )
    print("Worker started.")
    await worker.run()


if __name__ == "__main__":
    asyncio.run(main())
