import { Tilt }from 'react-tilt'
import { motion } from 'framer-motion'

import { styles } from '../styles'
import { github } from '../assets'
import { SectionWrapper } from '../hoc'
import { projects } from '../constants'
import { fadeIn, textVariant } from '../utils/motion'



const ProjectCard = ({ index, name, description, tags, image, source_code_link }) => {
  return (
    <motion.div variants={fadeIn("up", "Spring", index*0.5, 0.75)}>
      <Tilt
        options={{
          max: 45, 
          scale:1,
          speed: 450
        }}
        className="bg=tertiary p-5 rounded-2xl sm:w-[360px] w-full"
      >
        <div className='relative w-full h-[230px]'>
          <img
            src={image}
            alt={name}
            className="w-full h-full object-cover rounded-2xl"
            
          />
          <div className='absolute inset-0 flex justify-end card-img_hover'>
            <div
              onClick={() => window.open(source_code_link, "_blank")}
              className='black-grandient w-10 h-10 rounded-full flex justify-center items-center cursor-pointer'
              >
              <img 
                src={github}
                atl="github"
                className='w-1/2 h-1/2 object-contain'
              />
            </div>
          </div>
        </div>

        <div className='mt-5'> 
        <h3 className='text-white font-bold text-[24px]'>{name}</h3>
        <p className='mt-2 text-secondary text-[14px]'>{description}</p>

        </div>
        <div className='mt-4 flex flex-wrap gap-2'>
          {tags.map((tag) => (
            <p key={tag.name} className={`text-[14px] ${tag.color}`}>
              #{tag.name}
            </p>
          ))}


        </div>
      </Tilt>
    </motion.div>
  )
}

const Works = () => {
  return (
    <>
      <motion.div variants={textVariant()}>
      <p className={styles.sectionSubText}
        >My Recent</p>
        <h2 className={styles.sectionHeadText}
        >Projects.</h2>
      </motion.div>
      <div className='w-full flex'>
        <motion.p
          variants={fadeIn("","", 0.1, 1)}
          className='mt-3 text-secondary text-[17px] max-w-3xl leading-[30px]'
        >
          The projects highlighted below serve as a testament to my skills, experience, and dedication as a developer. They represent a diverse range of work, each chosen to showcase a unique aspect of my capabilities. From game development to web design, these projects demonstrate my ability to solve complex problems, adapt to various technologies, and effectively manage all stages of development. Each project includes a brief description, along with links to the code repositories and live demos, providing a comprehensive overview of my work. As you explore these projects, you'll see my commitment to creating high-quality, user-focused digital solutions.

        </motion.p>

      </div>
      <div className='mt-20 flex flex-wrap gap-7'>
        {projects.map((project, index) => (
          <ProjectCard 
            key={`project-${index}`}
            index={index}
            {...project}
          
          />

        ))}

      </div>
    </>
  )
}

export default SectionWrapper(Works, "");