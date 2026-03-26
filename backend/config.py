import os
from dotenv import load_dotenv

load_dotenv()

PROFILE = {
    "name": os.getenv("YOUR_NAME", "Seenivasan"),
    "email": os.getenv("YOUR_EMAIL", "svmaster141@gmail.com"),
    "phone": os.getenv("YOUR_PHONE", "+91 8056394029"),
    "location": os.getenv("YOUR_LOCATION", "Coimbatore, Tamil Nadu, India"),
    "linkedin": "https://www.linkedin.com/in/svpro24",
    "github": "https://github.com/seenivasan-ui",

    "summary": """Motivated fresher with hands-on experience in full-stack web development 
through 2 internships. Proficient in React, Node.js, Python, and Django. 
Passionate about building scalable web applications and eager to contribute 
to dynamic development teams. Quick learner with strong problem-solving skills.""",

    "skills": [
        "HTML", "CSS", "JavaScript", "React", "Python", "Django",
        "Node.js", "Express.js", "MongoDB", "MySQL", "PostgreSQL",
        "REST API", "JSON", "Git", "GitHub", "Bootstrap", "Axios",
        "JWT", "Docker", "AWS", "NumPy", "Pandas", "Matplotlib",
        "WebSockets", "ORM", "VS Code"
    ],

    "experience": [
        {
            "role": "Junior Associate - Production Support",
            "company": "Precicraft Components",
            "duration": "1 Year",
            "type": "job",
            "description": "Provided technical support and assistance in production environment."
        },
        {
            "role": "Web Development Intern",
            "company": "Internship 1",
            "duration": "3 Months",
            "type": "internship",
            "description": "Built responsive web applications using HTML, CSS, JavaScript and React. Developed RESTful APIs using Node.js and Express."
        },
        {
            "role": "Web Development Intern",
            "company": "Internship 2",
            "duration": "3 Months",
            "type": "internship",
            "description": "Developed Python Django web applications. Implemented database models and REST APIs."
        }
    ],

    "education": [
        {
            "degree": "B.Sc (Computer Science)",
            "institution": "GTN Arts and Science College",
            "year": "2024",
            "percentage": "60"
        }
    ],

    "certifications": [
        {"name": "Python Programming", "platform": "GUVI - IIT Madras Research Park", "year": "2023"},
        {"name": "Python for Machine Learning", "platform": "Great Learning", "year": "2023"},
    ],

    "target_roles": os.getenv(
        "TARGET_ROLES",
        "Frontend Developer,React Developer,Python Developer,Full Stack Developer,Backend Developer,MERN Stack Developer"
    ).split(","),

    "target_locations": os.getenv(
        "TARGET_LOCATIONS",
        "Chennai,Coimbatore,Trichy,Madurai,Bangalore,Remote"
    ).split(","),

    "experience_level": os.getenv("EXPERIENCE_LEVEL", "0-1"),
    "expected_salary": os.getenv("EXPECTED_SALARY", "3-6 LPA"),
}
