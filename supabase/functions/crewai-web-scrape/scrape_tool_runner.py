
import sys
from crewai import Agent, Task, Crew
from crewai_tools import ScrapeElementFromWebsiteTool

def main():
    if len(sys.argv) < 3:
        print("Usage: python scrape_tool_runner.py <url> <css_selector>")
        sys.exit(1)

    url = sys.argv[1]
    css_selector = sys.argv[2]

    scrape_tool = ScrapeElementFromWebsiteTool(
        website_url=url,
        css_element=css_selector
    )

    agent = Agent(
        role="Web Extractor",
        goal=f"Extract content from {url} using selector {css_selector}",
        backstory="Expert at extracting specific elements from websites using CSS selectors.",
        tools=[scrape_tool],
        verbose=False
    )

    task = Task(
        description=f"Extract content from {url} using CSS selector '{css_selector}'.",
        expected_output="Plain text content of the matching elements.",
        agent=agent
    )

    crew = Crew(agents=[agent], tasks=[task])
    result = crew.kickoff()
    print(result.strip())

if __name__ == "__main__":
    main()
