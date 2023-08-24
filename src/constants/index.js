import {
    mobile,
    backend,
    creator,
    web,
    javascript,
    typescript,
    html,
    css,
    reactjs,
    redux,
    tailwind,
    nodejs,
    mongodb,
    git,
    figma,
    docker,
    hack,
    pool,
    market,
    dme,
    shirt,
    glory,
    portfolio,
    threejs,
    bird,
    invaders,
  } from "../assets";
  
  export const navLinks = [
    {
      id: "about",
      title: "About",
    },
    {
      id: "work",
      title: "Work",
    },
    {
      id: "contact",
      title: "Contact",
    },
  ];
  
  const services = [
    {
      title: "Entrepreneur",
      icon: web,
    },
    {
      title: "Estimator",
      icon: mobile,
    },
    {
      title: "Implementation Manager",
      icon: backend,
    },
    {
      title: "Owner/Operator",
      icon: creator,
    },
  ];
  
  const technologies = [
    {
      name: "HTML 5",
      icon: html,
    },
    {
      name: "CSS 3",
      icon: css,
    },
    {
      name: "JavaScript",
      icon: javascript,
    },
    {
      name: "TypeScript",
      icon: typescript,
    },
    {
      name: "React JS",
      icon: reactjs,
    },
    {
      name: "Redux Toolkit",
      icon: redux,
    },
    {
      name: "Tailwind CSS",
      icon: tailwind,
    },
    {
      name: "Node JS",
      icon: nodejs,
    },
    {
      name: "MongoDB",
      icon: mongodb,
    },
    {
      name: "Three JS",
      icon: threejs,
    },
    {
      name: "git",
      icon: git,
    },
    {
      name: "figma",
      icon: figma,
    },
    {
      name: "docker",
      icon: docker,
    },
  ];
  
  const experiences = [
    {
      title: "Co-Owner/Operator",
      company_name: "Action Pools, and Spa, LLC.",
      icon: pool,
      iconBg: "#E6DEDD",
      date: "March 2010 - May 2017",
      points: [
        "Directed all business operations, from profit/loss analysis and tax management to customer satisfaction surveys and employee pay structure.",
        "Fostered a growth-centric work environment through continuous employee training and development.",
        "Developed a successful marketing campaign utilizing social media software strategies",
      ],
    },
    {
      title: "Implementation Manager",
      company_name: "DME Delivers, LLC.",
      icon: dme,
      iconBg: "#383E56",
      date: "Oct 2017 - Jan 2021",
      points: [
        "Successfully launched multiple web-based commerce platforms and B2B/B2C services.",
        "Administered business management systems, including Avanti Slingshot, Cyrious, Salesforce, BMS, and IPN, enhancing operational efficiency and productivity.",
        "Implementing responsive design and ensuring cross-browser compatibility.",
        "Managed and oversaw the execution of major projects, ensuring timely completion and customer satisfaction.",
      ],
    },
    {
      title: "Company Estimator",
      company_name: "MarketOnce Holding, LLC.",
      icon: market,
      iconBg: "#E6DEDD",
      date: "Jan 2021 - Jan 2023",
      points: [
        "Managed all company estimations, effectively handling quote generation for a diverse range of services, including mail print, wide format, promotional, and fulfillment.",
        "Led vendor relationship management and conducted price shopping to ensure cost efficiency.",
        "Provided strategic support to sales, contributing to deal closure and revenue growth.",
        "Leveraged comprehensive understanding of the company's operations to diversify business opportunities.",
      ],
    },
    {
      title: "Entrepreneur",
      company_name: "Hacktivate Nation",
      icon: hack,
      iconBg: "#383E56",
      date: "Jan 2023 - Present",
      points: [
        "Pioneering software development efforts utilizing Python, JavaScript, React, Flask, Django and more, with a particular emphasis on integrating AI technologies.",
        "Manage and maintain a public Discord server, fostering an engaging and supportive community for technology enthusiasts.",
        "Maintain an active GitHub portfolio showcasing a wide range of projects, demonstrating adaptability, lifelong learning, and mastery of emerging technologies.",
        "Conduct ongoing AI research, continuously pushing the boundaries of technology to develop innovative software solutions.",
      ],
    },
  ];
  
  const testimonials = [
    {
      testimonial:
        "I thought it was impossible to make a website as beautiful as our product, but Guru proved me wrong.",
      name: "Sara Lee",
      designation: "CFO",
      company: "Acme Co",
      image: "https://randomuser.me/api/portraits/women/4.jpg",
    },
    {
      testimonial:
        "I've never met a web developer who truly cares about their clients' success like Guru does.",
      name: "Chris Brown",
      designation: "COO",
      company: "DEF Corp",
      image: "https://randomuser.me/api/portraits/men/5.jpg",
    },
    {
      testimonial:
        "After Guru optimized our website, our traffic increased by 50%. We can't thank them enough!",
      name: "Lisa Wang",
      designation: "CTO",
      company: "456 Enterprises",
      image: "https://randomuser.me/api/portraits/women/6.jpg",
    },
  ];
  
  const projects = [
    {
      name: "AI T-shirt-Designer",
      description:
        "Web-based platform that allows customers to upload custom logo's, change color gradients, and use built in AI to generate images from DALL.E",
      tags: [
        {
          name: "react",
          color: "blue-text-gradient",
        },
        {
          name: "mongodb",
          color: "green-text-gradient",
        },
        {
          name: "tailwind",
          color: "pink-text-gradient",
        },
      ],
      image: shirt,
      source_code_link: "https://knotz-logosnshirt-designs.onrender.com/",
    },
    {
      name: "KnotzGameOfGlory",
      description:
        "The Game of Glory is an action-packed adventure where players must navigate through various obstacles, battling enemies and collecting rewards along the way. The game incorporates elements of real-time action, strategy, and platform gaming, resulting in an enthralling gaming experience.",
      tags: [
        {
          name: "javascript",
          color: "blue-text-gradient",
        },
        {
          name: "HTML",
          color: "green-text-gradient",
        },
        {
          name: "css",
          color: "pink-text-gradient",
        },
      ],
      image: glory,
      source_code_link: "https://github.com/KnotEnvy/KnotzTheGameOfGlory",
    },
    {
      name: "3D Portfolio",
      description:
        "Welcome to the digital portfolio of a dedicated coder, showcasing diverse proficiencies in JavaScript and Python. This collection exhibits an eclectic range of projects, from immersive game development and practical web applications to graphical manipulation and 3D modeling.",
      tags: [
        {
          name: "react",
          color: "blue-text-gradient",
        },
        {
          name: "tailwind",
          color: "green-text-gradient",
        },
        {
          name: "3js",
          color: "pink-text-gradient",
        },
      ],
      image: portfolio,
      source_code_link: "https://github.com/KnotEnvy?tab=repositories",
    },
    {
      name: "Knotz Raven Mayhem",
      description:
        "Knotz Raven Mayhem is a canvas-based interactive game designed with JavaScript. In the game, you play as an unseen force with the power to create explosions and destroy ravens that fly across your screen. The objective is to score as many points as possible by clicking on ravens, which will detonate on impact and add to your score.",
      tags: [
        {
          name: "javascript",
          color: "blue-text-gradient",
        },
        {
          name: "css",
          color: "green-text-gradient",
        },
        {
          name: "expressJS",
          color: "pink-text-gradient",
        },
      ],
      image: bird,
      source_code_link: "https://knotenvy.github.io/Knotz-Raven-Mayhem",
    },
    {
      name: "Knotz InvadeSpace",
      description:
        "KnotzInvadeSpace is a fun and challenging 2D space-invaders style arcade game where the player has to destroy oncoming waves of alien beetlemorphs. Each wave of enemies is progressively harder to destroy, requiring skill and quick reflexes to navigate through the game. This project uses HTML5 Canvas for rendering and vanilla JavaScript for game logic.",
      tags: [
        {
          name: "javascript",
          color: "blue-text-gradient",
        },
        {
          name: "css",
          color: "green-text-gradient",
        },
        {
          name: "HTML",
          color: "pink-text-gradient",
        },
      ],
      image: invaders,
      source_code_link: "https://knotenvy.github.io/KnotzInvadeSpace",
    },
  ];
  
  export { services, technologies, experiences, testimonials, projects };