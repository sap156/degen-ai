
import sys
from crewai import Agent, Task, Crew
from crewai_tools import VisionTool

def main():
    if len(sys.argv) < 2:
        print("Usage: python vision_tool_runner.py <image_path_or_url>")
        sys.exit(1)

    image_path = sys.argv[1]
    vision_tool = VisionTool()

    agent = Agent(
        role="OCR Agent",
        goal="Extract text from images accurately",
        backstory="Expert in reading and extracting text from image files using computer vision.",
        tools=[vision_tool],
        verbose=False
    )

    task = Task(
        description=f"Extract all readable text from the image at '{image_path}'.",
        expected_output="Text extracted from the image.",
        agent=agent,
        context={"image_path_url": image_path}
    )

    crew = Crew(agents=[agent], tasks=[task])
    result = crew.kickoff()
    print(result.strip())

if __name__ == "__main__":
    main()
