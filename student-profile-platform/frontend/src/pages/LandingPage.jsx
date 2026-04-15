import { Link } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { motion } from 'framer-motion'

const features = [
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
      </svg>
    ),
    title: 'Create Your Digital Portfolio',
    desc: 'Build a stunning digital portfolio that represents your academic and professional journey.',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
      </svg>
    ),
    title: 'Showcase Projects',
    desc: 'Display your best projects with descriptions, GitHub links, and live demos.',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Skills with Progress Bars',
    desc: 'Highlight your technical skills with beautiful animated progress bars.',
    color: 'from-amber-500 to-orange-500',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
      </svg>
    ),
    title: 'Upload Certificates',
    desc: 'Showcase your certifications and achievements with easy certificate uploads.',
    color: 'from-emerald-500 to-teal-500',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    ),
    title: 'Shareable Portfolio Link',
    desc: 'Get a unique URL for your profile that you can share with recruiters and peers.',
    color: 'from-rose-500 to-red-500',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: 'Social Networking',
    desc: 'Connect with peers, send friend requests, and see how you rank among your network.',
    color: 'from-indigo-500 to-violet-500',
  },
  {
    icon: (
      <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z" />
      </svg>
    ),
    title: 'QR Code Sharing',
    desc: 'Generate a QR code for instant profile sharing at events and meetups.',
    color: 'from-cyan-500 to-blue-500',
  },
]

const exampleSkills = [
  { name: 'React.js', level: 90 },
  { name: 'Python', level: 85 },
  { name: 'Machine Learning', level: 75 },
  { name: 'UI/UX Design', level: 70 },
]

const exampleProjects = [
  { title: 'AI Chatbot', desc: 'NLP-powered chatbot using transformers', tags: ['Python', 'NLP', 'FastAPI'] },
  { title: 'E-Commerce App', desc: 'Full-stack shopping platform', tags: ['React', 'Node.js', 'MongoDB'] },
  { title: 'Portfolio Builder', desc: 'Drag-and-drop portfolio creator', tags: ['React', 'Tailwind', 'Supabase'] },
]

export default function LandingPage() {
  const { user } = useAuth()

  return (
    <div className="overflow-hidden">
      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center justify-center gradient-bg-subtle">
        {/* Animated Background Elements */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-20 left-10 w-72 h-72 bg-primary-400/20 rounded-full filter blur-3xl animate-float"></div>
          <div className="absolute bottom-20 right-10 w-96 h-96 bg-accent-400/20 rounded-full filter blur-3xl animate-float" style={{ animationDelay: '2s' }}></div>
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary-300/10 rounded-full filter blur-3xl"></div>
        </div>

        <div className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center pt-24 pb-16">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 text-sm font-medium mb-8 animate-fade-in">
            <span className="w-2 h-2 rounded-full bg-primary-500 animate-pulse"></span>
            Open for all students
          </div>

          {/* Title */}
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-5xl sm:text-6xl lg:text-7xl font-display font-extrabold leading-tight mb-6"
          >
            Build Your{' '}
            <span className="gradient-text-animate">Student</span>
            <br />
            <span className="gradient-text-animate">Digital Profile</span>
          </motion.h1>

          {/* Subtitle */}
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-xl sm:text-2xl text-gray-500 dark:text-gray-400 max-w-3xl mx-auto mb-10"
          >
            Showcase your skills, projects, and achievements online.
            Create a professional portfolio that stands out.
          </motion.p>

          {/* CTA Buttons */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4"
          >
            {user ? (
              <Link to="/dashboard" className="btn-primary text-lg px-10 py-4 group">
                Go to Dashboard 
                <span className="inline-block transition-transform group-hover:translate-x-1 ml-2">→</span>
              </Link>
            ) : (
              <>
                <Link to="/login" className="btn-primary text-lg px-10 py-4">
                  Login
                </Link>
                <Link to="/register" className="btn-secondary text-lg px-10 py-4">
                  Register
                </Link>
              </>
            )}
          </motion.div>

          {/* Animated Student Journey Graphic (Replaced legacy stats) */}
          <div className="mt-20 relative h-40 max-w-2xl mx-auto hidden sm:flex items-center justify-center">
            {/* Project Card */}
            <motion.div 
              animate={{ 
                y: [0, -15, 0],
                x: [0, 5, 0]
              }}
              transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
              className="absolute left-4 lg:-left-20 top-0 p-4 glass-card border-blue-500/20 shadow-xl shadow-blue-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center text-xl">🚀</div>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-black tracking-widest text-blue-500">Projects</p>
                  <p className="text-sm font-bold dark:text-white">Creative Portfolios</p>
                </div>
              </div>
            </motion.div>

            {/* Middle Logo/Orbit Center */}
            <motion.div
              animate={{ scale: [1, 1.05, 1] }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-24 h-24 rounded-3xl gradient-bg flex items-center justify-center text-white shadow-2xl shadow-primary-500/40 z-20"
            >
              <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </motion.div>

            {/* Social Card */}
            <motion.div 
              animate={{ 
                y: [0, 15, 0],
                x: [0, -5, 0]
              }}
              transition={{ duration: 5, repeat: Infinity, ease: "easeInOut", delay: 1 }}
              className="absolute right-4 lg:-right-20 bottom-4 p-4 glass-card border-purple-500/20 shadow-xl shadow-purple-500/10"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 flex items-center justify-center text-xl">🤝</div>
                <div className="text-left">
                  <p className="text-[10px] uppercase font-black tracking-widest text-purple-500">Network</p>
                  <p className="text-sm font-bold dark:text-white">Active Connections</p>
                </div>
              </div>
            </motion.div>

            {/* Skills Bubble */}
            <motion.div 
              animate={{ 
                scale: [1, 1.1, 1],
                opacity: [0.7, 1, 0.7]
              }}
              transition={{ duration: 3, repeat: Infinity }}
              className="absolute top-[-20px] right-[20%] p-2 px-4 rounded-full glass-card border-amber-500/20 text-xs font-bold dark:text-amber-400 flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> New Skill Added
            </motion.div>

             {/* Connection Line Decoration */}
             <div className="absolute inset-0 flex items-center justify-center -z-10">
                <div className="w-full max-w-md h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent rotate-12"></div>
                <div className="w-full max-w-md h-[1px] bg-gradient-to-r from-transparent via-primary-500/20 to-transparent -rotate-12"></div>
             </div>
          </div>

          {/* Simple Mobile Stats */}
          <div className="mt-16 sm:hidden grid grid-cols-3 gap-4">
            {[['🚀', 'Projects'], ['⚡', 'Skills'], ['🏆', 'Rank']].map(([icon, label]) => (
              <div key={label} className="text-center p-3 glass-card">
                <div className="text-xl mb-1">{icon}</div>
                <div className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">{label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll Indicator */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
          <svg className="w-6 h-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3" />
          </svg>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-white dark:bg-surface-900" id="features">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">
              Everything You Need to{' '}
              <span className="gradient-text-animate">Stand Out</span>
            </h2>
            <p className="section-subtitle">
              Powerful tools to build, customize, and share your professional profile
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30, scale: 0.9 }}
                whileInView={{ opacity: 1, y: 0, scale: 1 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ 
                  duration: 0.6, 
                  delay: i * 0.1,
                  type: "spring",
                  stiffness: 100
                }}
                whileHover={{ 
                  y: -10,
                  scale: 1.02,
                  transition: { duration: 0.2 }
                }}
                className="glass-card-animated p-8 group cursor-default"
              >
                <motion.div 
                  whileHover={{ rotate: 12, scale: 1.1 }}
                  className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center text-white mb-6 shadow-lg transform transition-transform`}
                >
                  {feature.icon}
                </motion.div>
                <h3 className="text-xl font-semibold mb-3 dark:text-white group-hover:text-primary-500 transition-colors uppercase tracking-tight">{feature.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Example Profile Preview */}
      <section className="py-24 gradient-bg-subtle" id="preview">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="section-title mb-4">
              See What Your{' '}
              <span className="gradient-text-animate">Profile Looks Like</span>
            </h2>
            <p className="section-subtitle">
              A preview of the stunning portfolio you'll create
            </p>
          </div>

          <div className="max-w-4xl mx-auto glass-card p-8 md:p-12">
            {/* Profile Header */}
            <div className="flex flex-col md:flex-row items-center gap-6 mb-10">
              <div className="w-28 h-28 rounded-full gradient-bg flex items-center justify-center text-white text-4xl font-display font-bold shadow-2xl shadow-primary-500/30">
                A
              </div>
              <div className="text-center md:text-left">
                <h3 className="text-3xl font-display font-bold dark:text-white">Alex Johnson</h3>
                <p className="text-primary-500 font-semibold text-lg mt-1">AI/ML Student</p>
                <p className="text-gray-500 dark:text-gray-400 mt-2 max-w-lg">
                  Passionate about machine learning and full-stack development. Building AI-powered solutions for real-world problems.
                </p>
              </div>
            </div>

            {/* Skills Preview */}
            <div className="mb-10">
              <h4 className="text-xl font-semibold mb-4 dark:text-white">Skills</h4>
              <div className="space-y-4">
                {exampleSkills.map((skill) => (
                  <div key={skill.name}>
                    <div className="flex justify-between mb-1">
                      <span className="font-medium dark:text-gray-300">{skill.name}</span>
                      <span className="text-sm text-primary-500 font-semibold">{skill.level}%</span>
                    </div>
                    <div className="w-full h-3 bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full gradient-bg transition-all duration-1000 ease-out"
                        style={{ width: `${skill.level}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Projects Preview */}
            <div>
              <h4 className="text-xl font-semibold mb-4 dark:text-white">Projects</h4>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {exampleProjects.map((project) => (
                  <div key={project.title} className="p-5 rounded-xl bg-gray-50 dark:bg-surface-700/50 border border-gray-100 dark:border-surface-600 hover:border-primary-300 dark:hover:border-primary-600 transition-colors">
                    <h5 className="font-semibold mb-2 dark:text-white">{project.title}</h5>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{project.desc}</p>
                    <div className="flex flex-wrap gap-2">
                      {project.tags.map((tag) => (
                        <span key={tag} className="px-2 py-1 text-xs rounded-lg bg-primary-100 dark:bg-primary-900/50 text-primary-700 dark:text-primary-300 font-medium">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-white dark:bg-surface-900">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="glass-card gradient-bg p-12 md:p-16 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-r from-primary-600/50 to-accent-600/50"></div>
            <div className="relative z-10">
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                Ready to Build Your
                <br />
                Digital Profile?
              </h2>
              <p className="text-lg text-white/80 max-w-xl mx-auto mb-10">
                Join hundreds of students who are already showcasing their talents.
                It's free and takes only minutes to get started.
              </p>
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Link
                  to="/register"
                  className="px-10 py-4 rounded-xl font-semibold text-primary-600 bg-white hover:bg-gray-50 transform hover:-translate-y-0.5 transition-all duration-300 shadow-xl text-lg"
                >
                  Get Started Free →
                </Link>
                <Link
                  to="/leaderboard"
                  className="px-10 py-4 rounded-xl font-semibold text-white border-2 border-white/30 hover:bg-white/10 transform hover:-translate-y-0.5 transition-all duration-300 text-lg"
                >
                  View Leaderboard
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-50 dark:bg-surface-800 border-t border-gray-100 dark:border-surface-700 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg gradient-bg flex items-center justify-center">
                <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>
              <span className="font-display font-bold text-gray-900 dark:text-white">StudentProfile</span>
            </div>
            <p className="text-sm text-gray-500 dark:text-gray-400">
              © 2026 Student Digital Profile Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}
