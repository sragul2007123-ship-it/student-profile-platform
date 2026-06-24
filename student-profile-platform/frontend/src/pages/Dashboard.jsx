import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useTheme } from '../context/ThemeContext'
import { api } from '../services/api'
import { supabase } from '../services/supabaseClient'
import { motion, AnimatePresence } from 'framer-motion'

export const themeColorsMap = {
  primary: { emerald: '#00FFC6', cyan: '#00D4FF' }, // Neo Aurora default (emerald-cyan)
  emerald: { emerald: '#10b981', cyan: '#14b8a6' },
  rose: { emerald: '#f43f5e', cyan: '#ec4899' },
  amber: { emerald: '#f59e0b', cyan: '#f97316' },
  violet: { emerald: '#8b5cf6', cyan: '#d946ef' },
  cyan: { emerald: '#06b6d4', cyan: '#3b82f6' },
  lime: { emerald: '#84cc16', cyan: '#22c55e' },
  indigo: { emerald: '#6366f1', cyan: '#3b82f6' }
};

const defaultProfile = {
  name: '',
  username: '',
  role: '',
  about: '',
  profile_photo: '',
  github: '',
  linkedin: '',
  college: '',
  degree: '',
  year: '',
}

export default function Dashboard() {
  const { user, loading } = useAuth()
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [activeTab, setActiveTab] = useState('profile')
  const [showAnalysisModal, setShowAnalysisModal] = useState(false)
  const [insights, setInsights] = useState([
    { text: 'Loading AI insights...', color: 'emerald', highlight: 'AI insights' },
    { text: 'Analyzing your profile...', color: 'gold', highlight: 'profile' }
  ])
  const [profile, setProfile] = useState(defaultProfile)
  const [skills, setSkills] = useState([])
  const [projects, setProjects] = useState([])
  const [certificates, setCertificates] = useState([])
  const [friends, setFriends] = useState([])
  const [pendingRequests, setPendingRequests] = useState([])
  const [sentRequests, setSentRequests] = useState([])
  const [searchResults, setSearchResults] = useState([])
  const [searchQuery, setSearchQuery] = useState('')
  const [saving, setSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })
  const [selectedBadge, setSelectedBadge] = useState(null)
  const [badgeVisibility, setBadgeVisibility] = useState(true)
  // Profile customization state
  const [bannerImage, setBannerImage] = useState('')
  const { themeColor, setThemeColor } = useTheme()
  const [layoutStyle, setLayoutStyle] = useState('default')
  const [galleryImages, setGalleryImages] = useState([])
  const [profileLayout, setProfileLayout] = useState({ sections: ['about', 'skills', 'projects', 'certificates'] })

  // New item forms
  const [newSkill, setNewSkill] = useState({ skill_name: '', category: 'Technical', skill_level: 50 })
  const [newProject, setNewProject] = useState({ title: '', description: '', github_link: '', demo_link: '', image_url: '' })
  const [newCert, setNewCert] = useState({ title: '', certificate_url: '' })

  const skillCategories = ['Technical', 'Soft Skills', 'Tools', 'Languages', 'Other']

  useEffect(() => {
    // If not loading and no user, but the URL has an access token (from OAuth)
    // don't redirect yet as Supabase might still be processing it
    const hasHashSession = window.location.hash && (
      window.location.hash.includes('access_token=') || 
      window.location.hash.includes('error=')
    )
    
    // PREVIEW MODE: We no longer redirect to login on load. 
    // Unauthenticated users can view the dashboard with mock data.
    if (!loading && !user && !hasHashSession) {
      // navigate('/login')
    }
  }, [user, loading, navigate])

  useEffect(() => {
    if (user) {
      loadData()
    } else if (!loading && !user) {
      // PREVIEW MODE MOCK DATA
      setProfile({
        name: 'Alex Johnson',
        username: 'alexj',
        role: 'Computer Science Student',
        about: 'Passionate about artificial intelligence and building scalable web applications. Always learning, always building.',
        profile_photo: 'https://api.dicebear.com/7.x/avataaars/svg?seed=Alex&backgroundColor=00D4FF',
        github: 'https://github.com/alexj',
        linkedin: 'https://linkedin.com/in/alexj',
        college: 'University of Technology',
        degree: 'B.S. Computer Science',
        year: '2025'
      });
      setSkills([
        { id: 1, skill_name: 'React', category: 'Technical', skill_level: 90 },
        { id: 2, skill_name: 'Python', category: 'Technical', skill_level: 85 },
        { id: 3, skill_name: 'Machine Learning', category: 'Technical', skill_level: 70 },
      ]);
      setProjects([
        { id: 1, title: 'AI Study Assistant', description: 'Built a study assistant using OpenAI API.', github_link: '#', demo_link: '#', image_url: '' },
      ]);
      setCertificates([
        { id: 1, title: 'AWS Cloud Practitioner', certificate_url: '#' },
      ]);
      setFriends([]);
      setPendingRequests([]);
      setSentRequests([]);
    }
  }, [user, loading])

  useEffect(() => {
    const generateInsights = () => {
      const pool = [];

      // Always show generic industry insights
      pool.push(
        { 
          text: 'AI Engineering roles are up 40% this month. Start building a portfolio to stand out.', 
          color: 'emerald', 
          highlight: 'AI Engineering',
          title: 'AI Engineering Market Boom',
          detail: 'Global hiring for artificial intelligence and machine learning engineering has spiked by 40% this month. Recruiters are aggressively filtering for candidates with hands-on experience using LLMs, prompt engineering, and fine-tuning. Showcasing a project with real API integration is the best way to stand out.',
          actionLabel: 'Add AI Project',
          actionTab: 'projects'
        },
        { 
          text: 'Top recruiters are actively looking for Next.js and Tailwind experience.', 
          color: 'cyan', 
          highlight: 'Next.js',
          title: 'High Demand for Next.js developers',
          detail: 'Next.js is currently the leading React framework chosen by companies for building production-ready apps. Understanding server components, route optimization, and Tailwind CSS layouts makes you highly attractive for modern frontend roles.',
          actionLabel: 'Add Frontend Skill',
          actionTab: 'skills'
        },
        { 
          text: 'Students with verified certifications are 3x more likely to be contacted by recruiters.', 
          color: 'gold', 
          highlight: 'certifications',
          title: 'Boost Visibility via Certifications',
          detail: 'Adding industry-recognized certifications (AWS, GCP, Scrum, freeCodeCamp) proves to recruiters that you have gone through external screening. Verified profiles get contacted up to 3 times more often than unverified profiles.',
          actionLabel: 'Upload Certification',
          actionTab: 'certificates'
        },
        { 
          text: 'Tech companies value problem-solving skills; make sure your projects highlight the problems you solved.', 
          color: 'cyan', 
          highlight: 'problem-solving',
          title: 'Problem-Solving Focus',
          detail: 'Recruiters and hiring managers spend less than 30 seconds reading about a project. If your description does not highlight the specific problem you solved and the technical hurdles you overcame, it looks like a generic tutorial project.',
          actionLabel: 'Refine Projects',
          actionTab: 'projects'
        },
        { 
          text: 'Strong communication skills and soft skills are top qualities valued by tech team leads.', 
          color: 'emerald', 
          highlight: 'soft skills',
          title: 'The Value of Soft Skills',
          detail: 'While technical skills get you the interview, soft skills get you the job. Tech team leads prioritize candidates who can communicate ideas clearly, work well in collaborative structures, and show empathy. Write an engaging bio to showcase these traits.',
          actionLabel: 'Refine Bio',
          actionTab: 'profile'
        },
        { 
          text: 'Writing technical articles on Dev.to or Medium establishes your domain expertise.', 
          color: 'gold', 
          highlight: 'technical articles',
          title: 'Publish Technical Articles',
          detail: 'Blogging about your technical challenges, coding solutions, and general learning paths demonstrates that you understand the code at a foundational level. Linking your technical blog posts inside your bio is a major hiring signal.',
          actionLabel: 'Edit Profile Bio',
          actionTab: 'profile'
        }
      );

      if (user) {
        // User-specific insights based on profile completeness
        if (!profile.username) {
          pool.push({ 
            text: 'Claim your custom username in profile settings to share your portfolio link.', 
            color: 'gold', 
            highlight: 'custom username',
            title: 'Set Your Custom Username',
            detail: 'Your custom username creates a direct portfolio link (like academicos.hub/sragul). Without it, recruiters cannot access your public profile and your projects cannot be shared.',
            actionLabel: 'Claim Username Now',
            actionTab: 'profile'
          });
        }
        if (!profile.profile_photo) {
          pool.push({ 
            text: 'Profiles with a professional photo receive 5x more clicks from recruiters.', 
            color: 'cyan', 
            highlight: 'professional photo',
            title: 'Upload Profile Avatar',
            detail: 'Humanizing your command center starts with a profile photo. A high-quality professional photo or personalized avatar immediately builds credibility and increases search clicks by 500%.',
            actionLabel: 'Upload Photo',
            actionTab: 'profile'
          });
        }
        if (!profile.about) {
          pool.push({ 
            text: 'Write a brief summary in your about section to pitch your skills to recruiters.', 
            color: 'emerald', 
            highlight: 'about section',
            title: 'Create Your Elevator Pitch',
            detail: 'Your bio summary is the first thing recruiters and peers see. Use it to detail what you specialize in, what you are currently learning, and what roles you are seeking.',
            actionLabel: 'Write Bio Summary',
            actionTab: 'profile'
          });
        }
        if (!profile.github) {
          pool.push({ 
            text: 'Connect your GitHub profile so recruiters can check your repositories.', 
            color: 'cyan', 
            highlight: 'GitHub profile',
            title: 'Link GitHub Account',
            detail: 'GitHub is the ultimate proof of work. Connecting your profile allows peers and tech recruiters to explore your public codebases, code style, and active commit stats.',
            actionLabel: 'Link GitHub URL',
            actionTab: 'profile'
          });
        }
        if (!profile.linkedin) {
          pool.push({ 
            text: 'Link your LinkedIn profile to expand your network in the tech community.', 
            color: 'gold', 
            highlight: 'LinkedIn profile',
            title: 'Link LinkedIn Account',
            detail: 'LinkedIn is critical for placements and building a professional network. Make sure visitors can view your full professional network and connect with you.',
            actionLabel: 'Link LinkedIn URL',
            actionTab: 'profile'
          });
        }
        if (!profile.college || !profile.degree) {
          pool.push({ 
            text: 'Complete your education details to match with campus placement pipelines.', 
            color: 'emerald', 
            highlight: 'education details',
            title: 'Complete Education Profile',
            detail: 'Companies running placement drives filter candidates by their university, graduation year, and degree major. Complete these details to join those pipelines.',
            actionLabel: 'Add Education Detail',
            actionTab: 'education'
          });
        }

        // Skills-based insights
        if (skills.length > 0) {
          const topSkill = skills[0].skill_name;
          pool.push(
            { 
              text: `Your ${topSkill} skills are in high demand right now. Consider adding a ${topSkill} project to boost visibility.`, 
              color: 'emerald', 
              highlight: topSkill,
              title: `Demand for ${topSkill} Experts`,
              detail: `You've added ${topSkill} to your skills! To make it count, add a project that actively implements ${topSkill} concepts. It proves to hiring managers you can deliver production-level code.`,
              actionLabel: `Add ${topSkill} Project`,
              actionTab: 'projects'
            },
            { 
              text: `Recruiters search for candidates with verified ${topSkill} capabilities. Earn a badge in ${topSkill}!`, 
              color: 'gold', 
              highlight: topSkill,
              title: `Verify Your ${topSkill} Skills`,
              detail: `Show recruiters you are an expert in ${topSkill} by completing skills modules and obtaining a validated badge. Verified skills stand out on search indexes.`,
              actionLabel: "Verify Skills",
              actionTab: 'skills'
            }
          );
        } else {
          pool.push({ 
            text: 'Add at least 3 technical skills to help Mellow AI recommend the best career tracks for you.', 
            color: 'cyan', 
            highlight: '3 technical skills',
            title: 'Add Skill Tags',
            detail: 'Skills tags act as search filters. Recruiters search by key tags like React, Python, or SQL. Add at least 3 skills to make your profile search-discoverable.',
            actionLabel: 'Add Skills',
            actionTab: 'skills'
          });
        }

        // Projects-based insights
        if (projects.length === 0) {
          pool.push({ 
            text: 'Building your first project? Start small with a React or Python app to get on recruiters radars.', 
            color: 'gold', 
            highlight: 'first project',
            title: 'Launch Your First Project',
            detail: 'Do not wait until you know everything. A simple, working task manager, calculator, or basic script shows you know how to build, test, and host code.',
            actionLabel: 'Add First Project',
            actionTab: 'projects'
          });
        } else {
          pool.push(
            { 
              text: `You have ${projects.length} solid projects! Live demo links increase recruiter engagement by 400%.`, 
              color: 'emerald', 
              highlight: 'live demo links',
              title: 'Provide Project Demos',
              detail: 'Most recruiters do not pull and build code locally. Add a live demo link (Vercel, Netlify, Github Pages) so they can click and interact with your app instantly.',
              actionLabel: 'Add Demo Link',
              actionTab: 'projects'
            },
            { 
              text: `Make sure your projects list your core stack in the description so you show up in filtering search.`, 
              color: 'cyan', 
              highlight: 'core stack',
              title: 'List Tech Stacks in Projects',
              detail: 'Specify the technologies you used (e.g. React, Node, Express, MongoDB) inside each project description. Mellow AI indexes these keywords for placement recommendations.',
              actionLabel: 'Update Project Specs',
              actionTab: 'projects'
            }
          );
        }

        // Certificates-based insights
        if (certificates.length === 0) {
          pool.push({ 
            text: 'Add verified certifications to bypass initial technical screenings at major firms.', 
            color: 'gold', 
            highlight: 'certifications',
            title: 'Add Certifications',
            detail: 'Certifications act as third-party validation of your skills. Adding credentials in AWS, Google Cloud, or development bootcamps helps skip basic screeners.',
            actionLabel: 'Add Certificate',
            actionTab: 'certificates'
          });
        }
      }

      // Shuffle pool and select 2 distinct insights
      const shuffled = [...pool].sort(() => 0.5 - Math.random());
      setInsights(shuffled.slice(0, 2));
    };

    generateInsights();
    const interval = setInterval(generateInsights, 10000);
    return () => clearInterval(interval);
  }, [user, skills, projects, certificates, profile.username, profile.profile_photo, profile.github, profile.linkedin, profile.college, profile.about, profile.role]);

  const showMessage = (type, text) => {
    setMessage({ type, text })
    setTimeout(() => setMessage({ type: '', text: '' }), 5000)
  }

  const loadData = async (retryCount = 0) => {
    try {
      // Parallelize ALL data fetching for maximum speed
      // We wrap getProfile in its own try/catch to handle the "New User" race condition specifically
      let profileResponse, skillsData, projectsData, certsData, friendsData, pendingData, sentData;
      
      try {
        [
          profileResponse,
          skillsData, 
          projectsData, 
          certsData, 
          friendsData, 
          pendingData, 
          sentData
        ] = await Promise.all([
          api.getProfile(user.id),
          api.getSkills(user.id),
          api.getProjects(user.id),
          api.getCertificates(user.id),
          api.getFriends(user.id),
          api.getPendingRequests(user.id),
          api.getSentRequests(user.id)
        ]);
      } catch (err) {
        // Handle race condition where user record isn't ready in DB yet
        if (retryCount < 5) {
          return setTimeout(() => loadData(retryCount + 1), 2000);
        }
        throw err;
      }

      const userData = profileResponse.user
      const profileData = profileResponse.profile

      if (userData) {
        setProfile(prev => ({
          ...prev,
          name: userData.name || prev.name || user.user_metadata?.full_name || '',
          username: userData.username || prev.username || '',
          profile_photo: userData.profile_photo || prev.profile_photo || user.user_metadata?.avatar_url || '',
          email: userData.email || prev.email || user.email || '',
        }))
      }

      if (profileData) {
        setProfile(prev => ({
          ...prev,
          role: profileData.role || prev.role || '',
          about: profileData.about || prev.about || '',
          college: profileData.education?.college || prev.college || '',
          degree: profileData.education?.degree || prev.degree || '',
          year: profileData.education?.year || prev.year || '',
          github: profileData.github || prev.github || '',
          linkedin: profileData.linkedin || prev.linkedin || '',
        }))
        
        // Load customization settings
        setSelectedBadge(profileData.selected_badge || null)
        setBadgeVisibility(profileData.badge_visibility !== false)
        setBannerImage(profileData.banner_image || '')
        setThemeColor(profileData.theme_color || 'primary')
        setLayoutStyle(profileData.layout_style || 'default')
        setGalleryImages(profileData.gallery_images || [])
        setProfileLayout(profileData.profile_layout || { sections: ['about', 'skills', 'projects', 'certificates'] })
      }

      if (skillsData) setSkills(skillsData)
      if (projectsData) setProjects(projectsData)
      if (certsData) setCertificates(certsData)
      if (friendsData) setFriends(friendsData)
      if (pendingData) setPendingRequests(pendingData)
      if (sentData) setSentRequests(sentData)
    } catch (err) {
      console.error('Error loading data:', err)
      if (retryCount < 3) {
        setTimeout(() => loadData(retryCount + 1), 2000)
      }
    }
  }



  const requireAuth = (e) => {
    if (!user) {
      if (e && e.preventDefault) e.preventDefault();
      if (e && e.stopPropagation) e.stopPropagation();
      showMessage('error', 'Please create an account to use this feature.');
      setTimeout(() => navigate('/register'), 2000);
      return false;
    }
    return true;
  }

  const uploadFile = async (file, bucket, folder = '') => {
    const fileExt = file.name.split('.').pop()
    const fileName = `${user.id}-${Math.random().toString(36).substring(2)}.${fileExt}`
    const filePath = folder ? `${folder}/${fileName}` : fileName

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file)

    if (uploadError) throw uploadError

    const { data: { publicUrl } } = supabase.storage
      .from(bucket)
      .getPublicUrl(filePath)

    return publicUrl
  }

  const handlePhotoUpload = async (e) => {
    if (!requireAuth(e)) return;
    const file = e.target.files[0]
    if (!file) return

    if (!file.type.startsWith('image/')) {
      showMessage('error', 'Please upload an image file.')
      return
    }

    setUploading(true)
    try {
      const publicUrl = await uploadFile(file, 'Profiles', 'avatars')
      setProfile(prev => ({ ...prev, profile_photo: publicUrl }))
      showMessage('success', 'Photo uploaded! Don\'t forget to save your profile.')
    } catch (err) {
      console.error('Upload error:', err)
      showMessage('error', 'Error uploading photo: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleProjectImageUpload = async (e) => {
    if (!requireAuth(e)) return;
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const publicUrl = await uploadFile(file, 'Profiles', 'projects')
      setNewProject(prev => ({ ...prev, image_url: publicUrl }))
      showMessage('success', 'Project image uploaded!')
    } catch (err) {
       showMessage('error', 'Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const handleCertUpload = async (e) => {
    if (!requireAuth(e)) return;
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const publicUrl = await uploadFile(file, 'Profiles', 'certificates')
      setNewCert(prev => ({ ...prev, certificate_url: publicUrl }))
      showMessage('success', 'Certificate file uploaded!')
    } catch (err) {
       showMessage('error', 'Upload failed: ' + err.message)
    } finally {
      setUploading(false)
    }
  }

  const saveProfile = async () => {
    if (!requireAuth()) return;
    // Basic validation
    if (!profile.username || profile.username.trim() === '') {
      showMessage('error', 'Username is required for your public profile link.')
      return
    }
    
    // Remove spaces from username and ensure it's lowercase
    const cleanUsername = profile.username.toLowerCase().replace(/[^a-z0-9-_]/g, '')
    
    setSaving(true)
    try {
      await api.updateProfile(user.id, {
        name: profile.name,
        username: cleanUsername,
        role: profile.role,
        about: profile.about,
        profile_photo: profile.profile_photo,
        github: profile.github,
        linkedin: profile.linkedin,
        education: {
          college: profile.college,
          degree: profile.degree,
          year: profile.year,
        },
        // Include customization fields
        selected_badge: selectedBadge,
        badge_visibility: badgeVisibility,
        banner_image: bannerImage,
        theme_color: themeColor,
        layout_style: layoutStyle,
        gallery_images: galleryImages,
        profile_layout: profileLayout,
      })
      
      setProfile(prev => ({ ...prev, username: cleanUsername }))
      showMessage('success', 'Profile saved successfully!')
    } catch (err) {
      console.error('Save error:', err)
      showMessage('error', 'Error saving profile: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const addSkill = async () => {
    if (!requireAuth()) return;
    if (!newSkill.skill_name) return
    try {
      const data = await api.addSkill(user.id, newSkill)
      setSkills(prev => [data, ...prev])
      setNewSkill({ skill_name: '', category: 'Technical', skill_level: 50 })
      showMessage('success', 'Skill added!')
    } catch (err) {
      showMessage('error', 'Error adding skill')
    }
  }

  const deleteSkill = async (id) => {
    if (!requireAuth()) return;
    await api.deleteSkill(id)
    setSkills(prev => prev.filter(s => s.id !== id))
    showMessage('success', 'Skill deleted')
  }

  const addProject = async () => {
    if (!requireAuth()) return;
    if (!newProject.title) return
    try {
      const data = await api.addProject(user.id, newProject)
      setProjects(prev => [data, ...prev])
      setNewProject({ title: '', description: '', github_link: '', demo_link: '', image_url: '' })
      showMessage('success', 'Project added!')
    } catch (err) {
      showMessage('error', 'Error adding project')
    }
  }

  const deleteProject = async (id) => {
    if (!requireAuth()) return;
    await api.deleteProject(id)
    setProjects(prev => prev.filter(p => p.id !== id))
    showMessage('success', 'Project deleted')
  }

  const addCertificate = async () => {
    if (!requireAuth()) return;
    if (!newCert.title) return
    try {
      const data = await api.addCertificate(user.id, newCert)
      setCertificates(prev => [data, ...prev])
      setNewCert({ title: '', certificate_url: '' })
      showMessage('success', 'Certificate added!')
    } catch (err) {
      showMessage('error', 'Error adding certificate')
    }
  }

  const deleteCertificate = async (id) => {
    if (!requireAuth()) return;
    await api.deleteCertificate(id)
    setCertificates(prev => prev.filter(c => c.id !== id))
    showMessage('success', 'Certificate deleted')
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery.length > 1) {
        performSearch(searchQuery)
      } else {
        setSearchResults([])
      }
    }, 300)
    return () => clearTimeout(timer)
  }, [searchQuery])

  const performSearch = async (q) => {
    if (!requireAuth()) return;
    try {
      const results = await api.searchUsers(user.id, q)
      setSearchResults(results)
    } catch (err) {
      console.error('Search error:', err)
    }
  }

  const handleSearch = (e) => {
    setSearchQuery(e.target.value)
  }

  const sendFriendRequest = async (addresseeId) => {
    if (!requireAuth()) return;
    try {
      await api.sendFriendRequest(user.id, addresseeId)
      const sent = await api.getSentRequests(user.id)
      setSentRequests(sent)
      setSearchResults(prev => prev.filter(u => u.id !== addresseeId))
      showMessage('success', 'Friend request sent!')
    } catch (err) {
      showMessage('error', err.message)
    }
  }

  const acceptFriendRequest = async (friendshipId) => {
    if (!requireAuth()) return;
    try {
      await api.acceptFriendRequest(friendshipId)
      // Refresh friends and pending
      const [f, p] = await Promise.all([
        api.getFriends(user.id),
        api.getPendingRequests(user.id)
      ])
      setFriends(f)
      setPendingRequests(p)
      showMessage('success', 'Friend request accepted!')
    } catch (err) {
      showMessage('error', err.message)
    }
  }

  const rejectFriendRequest = async (friendshipId) => {
    if (!requireAuth()) return;
    try {
      await api.rejectFriendRequest(friendshipId)
      setPendingRequests(prev => prev.filter(r => r.friendship_id !== friendshipId))
      showMessage('success', 'Request rejected')
    } catch (err) {
      showMessage('error', err.message)
    }
  }

  const unfriend = async (friendshipId) => {
    if (!requireAuth()) return;
    if (!confirm('Are you sure you want to remove this friend?')) return
    try {
      await api.removeFriend(friendshipId)
      setFriends(prev => prev.filter(f => f.friendship_id !== friendshipId))
      showMessage('success', 'Friend removed')
    } catch (err) {
      showMessage('error', err.message)
    }
  }

  const calculateCompletion = () => {
    let score = 0;
    
    // Core Profile fields (40% total)
    if (profile.name) score += 5;
    if (profile.username) score += 5;
    if (profile.role) score += 5;
    if (profile.about) score += 5;
    if (profile.profile_photo) score += 10;
    if (profile.github) score += 5;
    if (profile.linkedin) score += 5;
    
    // Education details (15% total)
    if (profile.college) score += 5;
    if (profile.degree) score += 5;
    if (profile.year) score += 5;
    
    // Skill items (15% total: 3% per skill up to 5)
    if (skills && skills.length > 0) {
      score += Math.min(15, skills.length * 3);
    }
    
    // Project items (20% total: 10% per project up to 2)
    if (projects && projects.length > 0) {
      score += Math.min(20, projects.length * 10);
    }
    
    // Certificates items (10% total: 5% per certificate up to 2)
    if (certificates && certificates.length > 0) {
      score += Math.min(10, certificates.length * 5);
    }
    
    return Math.min(100, Math.round(score));
  };

  const completionPercent = calculateCompletion();

  const tabs = [
    { id: 'profile', label: 'Profile', icon: '👤' },
    { id: 'education', label: 'Education', icon: '🎓' },
    { id: 'skills', label: 'Skills', icon: '⚡' },
    { id: 'projects', label: 'Projects', icon: '🚀' },
    { id: 'certificates', label: 'Certificates', icon: '📜' },
    { id: 'customization', label: 'Customize', icon: '🎨' },
    { id: 'badges', label: 'Badges', icon: '⭐' },
    { id: 'friends', label: 'Friends', icon: '🤝' },
  ]

  const [isEditing, setIsEditing] = useState(false)
  const isAuthFlow = window.location.hash.includes('access_token=') || window.location.hash.includes('error=');

  if (loading && (isAuthFlow || !user)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center dark:bg-black">
        <div className="w-16 h-16 rounded-full border-4 border-primary-200 border-t-primary-500 animate-spin mb-4"></div>
        <h2 className="text-xl font-bold dark:text-white">Syncing your profile...</h2>
      </div>
    )
  }

  const themeColors = themeColorsMap[themeColor] || themeColorsMap.primary;

  return (
    <div 
      className="min-h-screen pt-20 pb-12 transition-colors duration-300"
      style={{
        '--emerald': themeColors.emerald,
        '--cyan': themeColors.cyan,
      }}
    >
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6">
        
        {/* Message Toast */}
        <AnimatePresence>
          {message.text && (
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className={`fixed top-24 left-1/2 -translate-x-1/2 z-50 px-6 py-2 rounded-lg text-sm font-bold shadow-2xl ${
                message.type === 'success' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'
              }`}
            >
              {message.text}
            </motion.div>
          )}
        </AnimatePresence>

        {!isEditing ? (
          <div className="animate-fade-in">
            {/* Header */}
            <div className="flex flex-col md:flex-row items-center justify-between gap-6 mb-8 mt-4">
              <div>
                <h1 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tight">Academic Command Center</h1>
                <p className="text-gray-400 font-medium mt-1">Welcome back, {profile.name?.split(' ')[0] || 'Student'}. Your identity score is looking strong.</p>
              </div>
              <div className="flex items-center gap-4">
                <button onClick={(e) => { if (requireAuth(e)) setIsEditing(true); }} className="px-6 py-2.5 rounded-xl font-bold bg-[var(--surface-2)] border border-[var(--border)] text-[var(--text)] hover:border-[var(--emerald)] transition-all flex items-center gap-2">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  Settings
                </button>
              </div>
            </div>

            {/* Bento Grid Layout */}
            <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 auto-rows-[160px]">
              
              {/* Identity Score Card (Spans 2x2) */}
              <motion.div 
                whileHover={{ scale: 1.02 }}
                className="col-span-1 md:col-span-2 row-span-2 glass-card p-6 md:p-8 relative overflow-hidden group cursor-pointer border-primary-500/20 shadow-[0_0_30px_rgba(99,102,241,0.05)] hover:shadow-[0_0_40px_rgba(99,102,241,0.1)]"
              >
                <div className="absolute -right-20 -top-20 w-64 h-64 bg-[var(--cyan)]/20 rounded-full blur-[80px] pointer-events-none group-hover:bg-[var(--cyan)]/30 transition-colors"></div>
                
                <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest mb-6">Academic Identity Score</h3>
                <div className="flex flex-col sm:flex-row items-center gap-8">
                  <div className="relative w-40 h-40 shrink-0">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="80" cy="80" r="70" className="stroke-[var(--surface-2)]" strokeWidth="12" fill="none" />
                      <circle cx="80" cy="80" r="70" className="stroke-primary-500 transition-all duration-1500" strokeWidth="12" fill="none" strokeLinecap="round" strokeDasharray="439.8" strokeDashoffset={439.8 - (439.8 * completionPercent) / 100} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-4xl font-display font-black text-white">{completionPercent}</span>
                      <span className="text-xs font-bold text-primary-400">/ 100</span>
                    </div>
                  </div>
                  
                  <div className="w-full flex-1 space-y-4">
                    <div>
                      <div className="flex justify-between text-xs font-bold text-gray-400 mb-2">
                        <span>Profile Completion</span>
                        <span className="text-white">{completionPercent}%</span>
                      </div>
                      <div className="w-full h-2 bg-[var(--surface-2)] rounded-full overflow-hidden">
                        <div className="h-full bg-gradient-to-r from-primary-600 to-accent-500 rounded-full" style={{width: `${completionPercent}%`}}></div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4 mt-6">
                      <div className="bg-[var(--surface-2)] p-3 rounded-xl border border-[var(--border)]">
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Placement Readiness</p>
                        <p className="text-lg font-bold text-[var(--emerald)]">High</p>
                      </div>
                      <div className="bg-[var(--surface-2)] p-3 rounded-xl border border-[var(--border)]">
                        <p className="text-[10px] uppercase font-bold text-gray-500 mb-1">Profile Views</p>
                        <p className="text-lg font-bold text-white">24</p>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Stats Grid */}
              <div className="col-span-1 row-span-1 glass-card p-6 flex flex-col justify-between hover:border-accent-500/30 transition-colors group cursor-pointer" onClick={() => { setIsEditing(true); setActiveTab('projects'); }}>
                <div className="w-10 h-10 rounded-xl bg-accent-500/10 flex items-center justify-center text-accent-400 mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                </div>
                <div>
                  <h3 className="text-3xl font-display font-black text-white">{projects.length}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Total Posts</p>
                </div>
              </div>

              <div className="col-span-1 row-span-1 glass-card p-6 flex flex-col justify-between hover:border-blue-500/30 transition-colors group cursor-pointer" onClick={() => { setIsEditing(true); setActiveTab('skills'); }}>
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-400 mb-2 group-hover:scale-110 transition-transform">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <h3 className="text-3xl font-display font-black text-white">{skills.length}</h3>
                  <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Skills Verified</p>
                </div>
              </div>

              {/* Achievements/Certificates */}
              <div className="col-span-1 md:col-span-2 row-span-1 glass-card p-6 flex items-center gap-6 overflow-hidden relative group border-white/5 hover:border-emerald-500/20 transition-colors cursor-pointer" onClick={() => { setIsEditing(true); setActiveTab('certificates'); }}>
                <div className="absolute right-0 top-0 bottom-0 w-32 bg-gradient-to-l from-[#0f111a] to-transparent z-10 pointer-events-none"></div>
                
                <div className="shrink-0 z-20 bg-[var(--surface-2)] pr-6">
                  <h3 className="text-sm font-bold text-emerald-400 uppercase tracking-widest mb-1">Certifications</h3>
                  <p className="text-2xl font-black text-white">{certificates.length} Earned</p>
                </div>

                <div className="flex gap-4 overflow-x-auto scrollbar-hide flex-1">
                  {certificates.length === 0 ? (
                    <div className="px-4 py-3 bg-[#111111] border border-white/5 rounded-xl text-sm text-gray-500 font-medium whitespace-nowrap">
                      No certifications yet
                    </div>
                  ) : (
                    certificates.map((cert, i) => (
                      <div key={i} className="px-4 py-3 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl flex items-center gap-3 shrink-0 hover:bg-[var(--glass)] transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-400">📜</div>
                        <div>
                          <p className="text-sm font-bold text-white max-w-[150px] truncate">{cert.title}</p>
                          <p className="text-[10px] text-gray-500 font-medium">Verified</p>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              {/* AI Career Insights Widget */}
              <div className="col-span-1 md:col-span-2 row-span-1 md:row-span-2 glass-card p-6 relative overflow-hidden group">
                <div className="absolute inset-0 bg-gradient-to-br from-primary-900/20 via-transparent to-accent-900/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-lg">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                    </div>
                    <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">AI Career Insights</h3>
                  </div>
                  <span className="px-2.5 py-1 rounded-md bg-primary-500/20 text-primary-400 text-[10px] font-black uppercase tracking-wider">Beta</span>
                </div>

                <div className="space-y-4">
                  {insights.map((insight, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] relative overflow-hidden transition-all duration-500">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-[var(--${insight.color})]`}></div>
                      <p className="text-sm text-gray-300 leading-relaxed font-medium">
                        {insight.text.split(insight.highlight).map((part, i, arr) => 
                          i === arr.length - 1 ? part : <span key={i}>{part}<strong className="text-white">{insight.highlight}</strong></span>
                        )}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              {/* Mini Feed / Recent Activity */}
              <div className="col-span-1 md:col-span-2 row-span-1 glass-card p-6 flex flex-col justify-center">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-sm font-bold text-gray-400 uppercase tracking-widest">Recent Post</h3>
                  <button onClick={() => navigate('/posts')} className="text-xs font-bold text-primary-400 hover:text-primary-300 transition-colors">View Feed →</button>
                </div>
                
                {projects.length > 0 ? (
                  <div className="flex items-center gap-4 bg-[#111111] p-4 rounded-xl border border-white/5">
                    {projects[0].image_url ? (
                      <img src={projects[0].image_url} alt="post" className="w-16 h-16 rounded-lg object-cover" />
                    ) : (
                      <div className="w-16 h-16 rounded-lg bg-surface-800 flex items-center justify-center text-xs font-bold text-gray-500">Text</div>
                    )}
                    <div>
                      <p className="text-sm font-bold text-white max-w-full truncate">{projects[0].title || projects[0].content}</p>
                      <p className="text-[10px] text-gray-500 font-medium mt-1 uppercase">Posted recently</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center justify-center h-20 border border-dashed border-white/10 rounded-xl">
                    <p className="text-xs font-medium text-gray-500">No recent activity</p>
                  </div>
                )}
              </div>

            </div>
          </div>
        ) : (
          /* Profile Editing View (Current Dashboard Content) */
          <div className="animate-fade-in">
            <div className="flex items-center justify-between mb-8">
              <button onClick={() => setIsEditing(false)} className="flex items-center gap-2 text-primary-600 font-bold">
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                Back to Profile
              </button>
              <h1 className="text-2xl font-bold dark:text-white">Settings</h1>
            </div>

            <div className="flex flex-col lg:flex-row gap-6">
              {/* Sidebar Tabs */}
              <div className="lg:w-48 shrink-0">
                <div className="flex lg:flex-col gap-1 overflow-x-auto lg:overflow-x-visible items-center lg:items-start border-b lg:border-none mb-4 lg:mb-0">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setActiveTab(tab.id)}
                      className={`px-4 py-2 text-sm font-bold w-full text-left transition-all ${activeTab === tab.id ? 'border-l-2 border-black dark:border-white text-black dark:text-white' : 'text-gray-400'}`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Edit Forms Container */}
              <div className="flex-1 min-h-[500px] glass-card p-8 border border-[var(--border)]">
                <AnimatePresence mode="wait">
                  <motion.div key={activeTab} initial={{opacity:0}} animate={{opacity:1}} exit={{opacity:0}}>
                    {activeTab === 'profile' && (
                      <>
                        <div className="flex flex-col items-center mb-10">
                    <div 
                      onClick={() => fileInputRef.current?.click()}
                      className="group relative w-32 h-32 rounded-full overflow-hidden gradient-bg flex items-center justify-center text-white text-5xl font-bold shadow-2xl cursor-pointer hover:scale-105 transition-all"
                    >
                      {profile.profile_photo ? (
                        <img src={profile.profile_photo} alt="Profile" className="w-full h-full object-cover group-hover:opacity-40 transition-opacity" />
                      ) : (
                        profile.name?.[0]?.toUpperCase() || 'U'
                      )}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                        <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                        </svg>
                      </div>
                      {uploading && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="w-8 h-8 border-4 border-white border-t-transparent animate-spin rounded-full"></div>
                        </div>
                      )}
                    </div>
                    <input type="file" ref={fileInputRef} onChange={handlePhotoUpload} accept="image/*" className="hidden" />
                    <p className="text-xs text-gray-500 mt-3 font-medium">Click photo to upload a new one</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pb-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Full Name</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Your full name"
                        value={profile.name}
                        onChange={e => setProfile(prev => ({ ...prev, name: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Username <span className="text-gray-400 dark:text-gray-500 text-[10px] font-bold ml-1 uppercase">(Required)</span>
                      </label>
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 font-medium">@</span>
                        <input
                          type="text"
                          className={`input-field pl-8 ${!profile.username ? 'border-amber-300 dark:border-amber-900/50 bg-amber-50/30' : ''}`}
                          placeholder="yourname"
                          value={profile.username}
                          required
                          onChange={e => setProfile(prev => ({ ...prev, username: e.target.value.toLowerCase().replace(/[^a-z0-9-_]/g, '') }))}
                        />
                      </div>
                      <p className="text-[10px] text-gray-500 mt-1">This will be your unique profile link.</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Role / Title</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g., AIML Student"
                        value={profile.role}
                        onChange={e => setProfile(prev => ({ ...prev, role: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Email</label>
                      <input
                        type="email"
                        className="input-field cursor-not-allowed text-[var(--muted)] bg-[var(--surface-2)]"
                        value={user?.email || ''}
                        disabled
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">GitHub URL</label>
                      <input
                        type="url"
                        className="input-field"
                        placeholder="https://github.com/..."
                        value={profile.github}
                        onChange={e => setProfile(prev => ({ ...prev, github: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">LinkedIn URL</label>
                      <input
                        type="url"
                        className="input-field"
                        placeholder="https://linkedin.com/in/..."
                        value={profile.linkedin}
                        onChange={e => setProfile(prev => ({ ...prev, linkedin: e.target.value }))}
                      />
                    </div>
                  </div>

                  <div className="mt-2">
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">About</label>
                    <textarea
                      className="input-field h-32 resize-none"
                      placeholder="Tell us about yourself..."
                      value={profile.about}
                      onChange={e => setProfile(prev => ({ ...prev, about: e.target.value }))}
                    />
                  </div>

                  <button onClick={saveProfile} disabled={saving} className="btn-primary mt-8 w-full md:w-auto">
                    {saving ? 'Saving...' : 'Save Profile Changes'}
                  </button>
                </>
              )}

              {/* Education Tab */}
              {activeTab === 'education' && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-semibold mb-6 dark:text-white">Education</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="md:col-span-2">
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">College / University</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="Your college name"
                        value={profile.college}
                        onChange={e => setProfile(prev => ({ ...prev, college: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Degree</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g., B.Tech in Computer Science"
                        value={profile.degree}
                        onChange={e => setProfile(prev => ({ ...prev, degree: e.target.value }))}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Year</label>
                      <input
                        type="text"
                        className="input-field"
                        placeholder="e.g., 2023 - 2027"
                        value={profile.year}
                        onChange={e => setProfile(prev => ({ ...prev, year: e.target.value }))}
                      />
                    </div>
                  </div>
                  <button onClick={saveProfile} disabled={saving} className="btn-primary mt-6">
                    {saving ? 'Saving...' : 'Save Education'}
                  </button>
                </div>
              )}

              {/* Skills Tab */}
              {activeTab === 'skills' && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-semibold mb-6 dark:text-white">Skills</h2>

                  {/* Add Skill Form */}
                  <div className="glass-card p-6 mb-8">
                    <h3 className="font-medium mb-4 text-[var(--text)]">Add New Skill</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 items-end">
                      <div className="lg:col-span-1">
                        <label className="block text-sm text-gray-500 mb-1">Skill Name</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g., React.js"
                          value={newSkill.skill_name}
                          onChange={e => setNewSkill(prev => ({ ...prev, skill_name: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">Category</label>
                        <select 
                          className="input-field"
                          value={newSkill.category}
                          onChange={e => setNewSkill(prev => ({ ...prev, category: e.target.value }))}
                        >
                          {skillCategories.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">Level: {newSkill.skill_level}%</label>
                        <input
                          type="range"
                          min="0"
                          max="100"
                          className="w-full accent-primary-500 mt-2"
                          value={newSkill.skill_level}
                          onChange={e => setNewSkill(prev => ({ ...prev, skill_level: parseInt(e.target.value) }))}
                        />
                      </div>
                      <button onClick={addSkill} className="btn-primary w-full">Add Skill</button>
                    </div>
                  </div>

                  {/* Skills List by Category */}
                  <div className="space-y-8">
                    {skillCategories.map(category => {
                      const catSkills = skills.filter(s => s.category === category)
                      if (catSkills.length === 0) return null
                      
                      return (
                        <div key={category}>
                          <h3 className="text-sm font-bold uppercase tracking-wider text-primary-600 dark:text-primary-400 mb-4">{category}</h3>
                          <div className="space-y-4">
                            {catSkills.map(skill => (
                              <div key={skill.id} className="flex items-center gap-4 glass-card p-4 group card-hover">
                                <div className="flex-1">
                                  <div className="flex justify-between mb-1">
                                    <span className="font-medium text-[var(--text)]">{skill.skill_name}</span>
                                    <span className="text-sm text-primary-500 font-semibold">{skill.skill_level}%</span>
                                  </div>
                                  <div className="w-full h-2 bg-gray-100 dark:bg-surface-700 rounded-full overflow-hidden">
                                    <div className="h-full rounded-full gradient-bg" style={{ width: `${skill.skill_level}%` }}></div>
                                  </div>
                                </div>
                                <button
                                  onClick={() => deleteSkill(skill.id)}
                                  className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all"
                                >
                                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    })}
                    {skills.length === 0 && (
                      <p className="text-center text-gray-400 dark:text-gray-500 py-12">No skills added yet. Define your sections above!</p>
                    )}
                  </div>
                </div>
              )}

              {/* Projects Tab */}
              {activeTab === 'projects' && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-semibold mb-6 dark:text-white">Projects</h2>

                  {/* Add Project Form */}
                  <div className="glass-card p-6 mb-6">
                    <h3 className="font-medium mb-4 text-[var(--text)]">Add New Project</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">Title</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="Project title"
                          value={newProject.title}
                          onChange={e => setNewProject(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">GitHub Link</label>
                        <input
                          type="url"
                          className="input-field"
                          placeholder="https://github.com/..."
                          value={newProject.github_link}
                          onChange={e => setNewProject(prev => ({ ...prev, github_link: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-500 mb-1">Description</label>
                        <textarea
                          className="input-field h-20 resize-none"
                          placeholder="Brief project description"
                          value={newProject.description}
                          onChange={e => setNewProject(prev => ({ ...prev, description: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-1">Demo Link (optional)</label>
                        <input
                          type="url"
                          className="input-field"
                          placeholder="https://..."
                          value={newProject.demo_link}
                          onChange={e => setNewProject(prev => ({ ...prev, demo_link: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-500 mb-2">Project Preview Image</label>
                        <div className="flex gap-4 items-center">
                          <button 
                            type="button"
                            onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*';
                                input.onchange = handleProjectImageUpload;
                                input.click();
                            }}
                            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-surface-600 rounded-xl hover:border-primary-500 dark:hover:border-primary-500 transition-all text-sm font-medium text-gray-500"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            {uploading ? 'Uploading...' : 'Upload Image'}
                          </button>
                        </div>
                      </div>
                      <div className="flex items-end">
                        <button onClick={addProject} className="btn-primary w-full sm:w-auto">Add Project</button>
                      </div>
                    </div>
                  </div>

                  {/* Projects List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projects.length === 0 && (
                      <p className="text-center text-gray-400 dark:text-gray-500 py-8 md:col-span-2">No projects added yet.</p>
                    )}
                    {projects.map(project => (
                      <div key={project.id} className="glass-card p-5 group card-hover">
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-semibold text-[var(--text)]">{project.title}</h4>
                          <button
                            onClick={() => deleteProject(project.id)}
                            className="opacity-0 group-hover:opacity-100 p-1 text-red-400 hover:text-red-600 rounded transition-all"
                          >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mb-3">{project.description}</p>
                        <div className="flex gap-3">
                          {project.github_link && (
                            <a href={project.github_link} target="_blank" rel="noopener noreferrer" className="text-xs text-primary-500 hover:underline">GitHub</a>
                          )}
                          {project.demo_link && (
                            <a href={project.demo_link} target="_blank" rel="noopener noreferrer" className="text-xs text-accent-500 hover:underline">Demo</a>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Certificates Tab */}
              {activeTab === 'certificates' && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-semibold mb-6 dark:text-white">Certificates</h2>

                  <div className="glass-card p-6 mb-8">
                    <h3 className="font-medium mb-4 text-[var(--text)]">Add New Certificate</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-end">
                      <div className="md:col-span-2">
                        <label className="block text-sm text-gray-500 mb-1">Certificate Title</label>
                        <input
                          type="text"
                          className="input-field"
                          placeholder="e.g., AWS Cloud Practitioner"
                          value={newCert.title}
                          onChange={e => setNewCert(prev => ({ ...prev, title: e.target.value }))}
                        />
                      </div>
                      <div>
                        <label className="block text-sm text-gray-500 mb-2">Upload Certificate File (Image/PDF)</label>
                        <button 
                             type="button"
                             onClick={() => {
                                const input = document.createElement('input');
                                input.type = 'file';
                                input.accept = 'image/*,application/pdf';
                                input.onchange = handleCertUpload;
                                input.click();
                            }}
                            className="flex items-center gap-2 px-4 py-2 border-2 border-dashed border-gray-300 dark:border-surface-600 rounded-xl hover:border-primary-500 transition-all text-sm font-medium w-full text-gray-500 bg-white dark:bg-surface-800"
                        >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                            </svg>
                            {uploading ? 'Uploading...' : 'Upload File'}
                        </button>
                      </div>
                      <div className="flex flex-col">
                        <label className="block text-sm text-gray-500 mb-1">Or Certificate Link</label>
                        <input
                          type="url"
                          className="input-field"
                          placeholder="https://..."
                          value={newCert.certificate_url}
                          onChange={e => setNewCert(prev => ({ ...prev, certificate_url: e.target.value }))}
                        />
                      </div>
                      <div className="md:col-span-2">
                         <button onClick={addCertificate} className="btn-primary w-full shadow-lg shadow-primary-500/20">Add Certificate</button>
                      </div>
                    </div>
                  </div>

                  {/* Certificates List */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {certificates.length === 0 && (
                      <p className="text-center text-gray-400 dark:text-gray-500 py-8 md:col-span-2">No certificates added yet.</p>
                    )}
                    {certificates.map(cert => (
                      <div key={cert.id} className="flex items-center gap-4 glass-card p-5 group card-hover">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center text-white shrink-0 shadow-[0_0_15px_rgba(251,191,36,0.3)]">
                          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold dark:text-white truncate">{cert.title}</h4>
                          {cert.certificate_url && (
                            <a href={cert.certificate_url} target="_blank" rel="noopener noreferrer" className="text-sm text-primary-500 hover:underline">View Certificate →</a>
                          )}
                        </div>
                        <button
                          onClick={() => deleteCertificate(cert.id)}
                          className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 rounded-lg transition-all"
                        >
                          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Badges Tab */}
              {activeTab === 'badges' && (
                <div className="animate-fade-in">
                  <h2 className="text-xl font-semibold mb-6 text-[var(--text)]">Customize Your Badge</h2>
                  
                  <div className="glass-card p-6 mb-8 border-[var(--cyan)]">
                    <h3 className="font-semibold text-[var(--text)] mb-2">🎖️ How to Get Badges</h3>
                    <ul className="text-sm text-[var(--muted)] space-y-1">
                      <li>✅ <strong>Elite Scholar 👑</strong> - Reach Top 10 in the Leaderboard</li>
                      <li>✅ <strong>Master Scholar 🏆</strong> - Reach Top 50 in the Leaderboard</li>
                      <li>💡 Keep adding skills, projects, and certificates to improve your ranking!</li>
                    </ul>
                  </div>

                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 dark:text-white">Your Available Badges</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                      {/* Elite Scholar Badge */}
                      <div 
                        onClick={() => setSelectedBadge('elite')}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                          selectedBadge === 'elite'
                            ? 'border-primary-500 bg-primary-500/10 shadow-[0_0_15px_rgba(0,255,198,0.2)]'
                            : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--cyan)]'
                        }`}
                      >
                        <div className="text-4xl mb-2">👑</div>
                        <h4 className="font-bold text-[var(--text)]">Elite Scholar</h4>
                        <p className="text-xs text-[var(--muted)]">Top 10 Student</p>
                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-xs font-semibold text-[var(--muted)]">Status</span>
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-500 border border-yellow-500/50">Locked</span>
                        </div>
                      </div>

                      {/* Master Scholar Badge */}
                      <div 
                        onClick={() => setSelectedBadge('master')}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                          selectedBadge === 'master'
                            ? 'border-primary-500 bg-primary-500/10 shadow-[0_0_15px_rgba(0,255,198,0.2)]'
                            : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--cyan)]'
                        }`}
                      >
                        <div className="text-4xl mb-2">🏆</div>
                        <h4 className="font-bold text-[var(--text)]">Master Scholar</h4>
                        <p className="text-xs text-[var(--muted)]">Top 50 Student</p>
                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-xs font-semibold text-[var(--muted)]">Status</span>
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-yellow-500/20 text-yellow-500 border border-yellow-500/50">Locked</span>
                        </div>
                      </div>

                      {/* Diamond Scholar Badge */}
                      <div 
                        onClick={() => setSelectedBadge('diamond')}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                          selectedBadge === 'diamond'
                            ? 'border-primary-500 bg-primary-500/10 shadow-[0_0_15px_rgba(0,255,198,0.2)]'
                            : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--cyan)]'
                        }`}
                      >
                        <div className="text-4xl mb-2">💎</div>
                        <h4 className="font-bold text-[var(--text)]">Diamond Scholar</h4>
                        <p className="text-xs text-[var(--muted)]">Exceptional Achiever</p>
                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-xs font-semibold text-[var(--muted)]">Status</span>
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-[var(--emerald)]/20 text-[var(--emerald)] border border-[var(--emerald)]/50">Available</span>
                        </div>
                      </div>

                      {/* Star Scholar Badge */}
                      <div 
                        onClick={() => setSelectedBadge('star')}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                          selectedBadge === 'star'
                            ? 'border-[var(--emerald)] bg-[var(--emerald)]/10 shadow-[0_0_15px_rgba(0,255,198,0.2)]'
                            : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--cyan)]'
                        }`}
                      >
                        <div className="text-4xl mb-2">⭐</div>
                        <h4 className="font-bold text-[var(--text)]">Star Scholar</h4>
                        <p className="text-xs text-[var(--muted)]">Rising Star</p>
                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-xs font-semibold text-[var(--muted)]">Status</span>
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-[var(--emerald)]/20 text-[var(--emerald)] border border-[var(--emerald)]/50">Available</span>
                        </div>
                      </div>

                      {/* Rocket Scholar Badge */}
                      <div 
                        onClick={() => setSelectedBadge('rocket')}
                        className={`p-6 rounded-xl border-2 cursor-pointer transition-all transform hover:scale-105 ${
                          selectedBadge === 'rocket'
                            ? 'border-[var(--cyan)] bg-[var(--cyan)]/10 shadow-[0_0_15px_rgba(0,212,255,0.2)]'
                            : 'border-[var(--border)] bg-[var(--surface-2)] text-[var(--text)] hover:border-[var(--cyan)]'
                        }`}
                      >
                        <div className="text-4xl mb-2">🚀</div>
                        <h4 className="font-bold text-[var(--text)]">Rocket Scholar</h4>
                        <p className="text-xs text-[var(--muted)]">Fast Progress</p>
                        <div className="mt-3 flex justify-between items-center">
                          <span className="text-xs font-semibold text-[var(--muted)]">Status</span>
                          <span className="px-2 py-1 rounded text-xs font-semibold bg-[var(--emerald)]/20 text-[var(--emerald)] border border-[var(--emerald)]/50">Available</span>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Badge Visibility Settings */}
                  <div className="glass-card p-6 mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-[var(--text)]">Badge Visibility</h3>
                    <label className="flex items-center gap-3 cursor-pointer">
                      <input 
                        type="checkbox" 
                        checked={badgeVisibility} 
                        onChange={(e) => setBadgeVisibility(e.target.checked)}
                        className="w-5 h-5 rounded accent-[var(--cyan)]"
                      />
                      <span className="text-[var(--text)]">
                        Show my badge on my profile and in the leaderboard
                      </span>
                    </label>
                    <p className="text-sm text-[var(--muted)] mt-2">
                      {badgeVisibility 
                        ? '✅ Your badge will be visible to others' 
                        : '🔒 Your badge will be hidden from public view'}
                    </p>
                  </div>

                  {/* Selected Badge Preview */}
                  {selectedBadge && (
                    <div className="mb-8 p-6 rounded-xl bg-gradient-to-br from-primary-50 to-indigo-50 dark:from-primary-900/20 dark:to-indigo-900/20 border border-primary-200 dark:border-primary-800">
                      <h3 className="text-lg font-semibold mb-4 dark:text-white">Badge Preview</h3>
                      <div className="text-center py-8">
                        <div className="text-6xl mb-4 inline-block">
                          {selectedBadge === 'elite' && '👑'}
                          {selectedBadge === 'master' && '🏆'}
                          {selectedBadge === 'diamond' && '💎'}
                          {selectedBadge === 'star' && '⭐'}
                          {selectedBadge === 'rocket' && '🚀'}
                        </div>
                        <p className="text-gray-600 dark:text-gray-300">
                          This badge will appear on your profile and leaderboard ranking
                        </p>
                      </div>
                    </div>
                  )}

                  <button onClick={saveProfile} disabled={saving} className="btn-primary w-full shadow-lg shadow-primary-500/20">
                    {saving ? 'Saving...' : 'Save Badge Settings'}
                  </button>
                </div>
              )}

              {/* Customization Tab */}
              {activeTab === 'customization' && (
                <div className="animate-fade-in">
                  <h2 className="text-2xl font-display font-bold mb-6 text-[var(--text)]">🎨 Profile Customization</h2>
                  <p className="text-[var(--muted)] mb-8">Make your profile unique with custom themes, layouts, and media.</p>

                  {/* Theme Color */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-[var(--text)]">Theme Color</h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      {[
                        { id: 'primary', name: 'Neo Aurora (Cyan/Green)', color: 'from-[#00FFC6] to-[#00D4FF]' },
                        { id: 'emerald', name: 'Emerald', color: 'from-emerald-500 to-teal-600' },
                        { id: 'rose', name: 'Rose', color: 'from-rose-500 to-pink-600' },
                        { id: 'amber', name: 'Amber', color: 'from-amber-500 to-orange-600' },
                        { id: 'violet', name: 'Violet', color: 'from-violet-500 to-purple-600' },
                        { id: 'cyan', name: 'Cyan', color: 'from-cyan-500 to-blue-600' },
                        { id: 'lime', name: 'Lime', color: 'from-lime-500 to-green-600' },
                        { id: 'indigo', name: 'Indigo', color: 'from-indigo-500 to-blue-600' }
                      ].map(theme => (
                        <button
                          key={theme.id}
                          type="button"
                          onClick={() => setThemeColor(theme.id)}
                          className={`p-4 rounded-xl border-2 transition-all ${
                            themeColor === theme.id
                              ? 'border-[var(--cyan)] bg-[var(--surface-hover)] shadow-lg shadow-[var(--cyan)]/25'
                              : 'border-[var(--border)] hover:border-[var(--cyan)]/50 bg-[var(--surface)]'
                          }`}
                        >
                          <div className={`w-full h-8 rounded-lg bg-gradient-to-r ${theme.color} mb-2`}></div>
                          <p className="text-sm font-medium text-[var(--text)]">{theme.name}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Layout Style */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-[var(--text)]">Layout Style</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {[
                        { id: 'default', name: 'Default', description: 'Clean, modern glassmorphism with floating backdrops' },
                        { id: 'minimal', name: 'Minimal', description: 'Compact centered layout, simple headers, clean borders' },
                        { id: 'creative', name: 'Creative', description: 'Vibrant, high-contrast, interactive tilted cards' },
                        { id: 'professional', name: 'Professional', description: 'Solid slate background, structured layout, clean alignment' }
                      ].map(layout => (
                        <button
                          key={layout.id}
                          type="button"
                          onClick={() => setLayoutStyle(layout.id)}
                          className={`p-6 rounded-xl border-2 text-left transition-all ${
                            layoutStyle === layout.id
                              ? 'border-[var(--cyan)] bg-[var(--surface-hover)] shadow-lg shadow-[var(--cyan)]/25'
                              : 'border-[var(--border)] hover:border-[var(--cyan)]/50 bg-[var(--surface)]'
                          }`}
                        >
                          <h4 className="font-semibold text-[var(--text)] mb-1">{layout.name}</h4>
                          <p className="text-sm text-[var(--muted)]">{layout.description}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Gallery Images */}
                  <div className="mb-8">
                    <h3 className="text-lg font-semibold mb-4 text-[var(--text)]">Gallery Images</h3>
                    <p className="text-sm text-[var(--muted)] mb-4">Add up to 6 images to showcase your work or personality</p>
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-4">
                      {galleryImages.map((image, index) => (
                        <div key={index} className="relative group">
                          <div className="aspect-square rounded-xl overflow-hidden border border-[var(--border)]">
                            <img src={image} alt={`Gallery ${index + 1}`} className="w-full h-full object-cover" />
                          </div>
                          <button
                            type="button"
                            onClick={() => setGalleryImages(prev => prev.filter((_, i) => i !== index))}
                            className="absolute top-2 right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            ×
                          </button>
                        </div>
                      ))}
                      {galleryImages.length < 6 && (
                        <div className="aspect-square rounded-xl border-2 border-dashed border-[var(--border)] flex items-center justify-center cursor-pointer hover:border-[var(--cyan)] transition-colors"
                             onClick={() => {
                               const url = prompt('Enter image URL:');
                               if (url) setGalleryImages(prev => [...prev, url]);
                             }}>
                          <div className="text-center">
                            <svg className="w-8 h-8 text-[var(--muted)] mx-auto mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                            </svg>
                            <p className="text-xs text-[var(--muted)]">Add Image</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>

                  <button onClick={saveProfile} disabled={saving} className="btn-primary w-full shadow-lg shadow-[var(--cyan)]/20">
                    {saving ? 'Saving...' : 'Save Customization'}
                  </button>
                </div>
              )}



              {/* Friends Tab */}
              {activeTab === 'friends' && (
                <div className="animate-fade-in">
                  <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
                    <h2 className="text-xl font-semibold dark:text-white">Friends & Networking</h2>
                    <div className="relative w-full md:w-64">
                      <input
                        type="text"
                        className="input-field pl-10 text-sm"
                        placeholder="Search students..."
                        value={searchQuery}
                        onChange={(e) => { if (requireAuth(e)) handleSearch(e); }}
                      />
                      <svg className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>

                      {/* Search Results Dropdown */}
                      {searchResults.length > 0 && (
                        <div className="absolute top-full left-0 right-0 mt-2 glass-card shadow-2xl z-50 overflow-hidden animate-scale-in">
                          {searchResults.map(u => (
                            <div key={u.id} className="flex items-center justify-between p-3 border-b border-gray-50 dark:border-surface-700 last:border-0 hover:bg-gray-50 dark:hover:bg-surface-700 transition-colors">
                              <div className="flex items-center gap-2">
                                <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-white text-xs font-bold shrink-0">
                                  {u.profile_photo ? <img src={u.profile_photo} className="w-full h-full object-cover rounded-full" /> : u.name?.[0]}
                                </div>
                                <div className="min-w-0">
                                  <p className="text-xs font-semibold dark:text-white truncate">{u.name}</p>
                                  <p className="text-[10px] text-gray-500 truncate">@{u.username}</p>
                                </div>
                              </div>
                              <button
                                onClick={() => sendFriendRequest(u.id)}
                                className="p-1.5 rounded-lg bg-primary-50 dark:bg-primary-900/30 text-primary-600 dark:text-primary-400 hover:bg-primary-500 hover:text-white transition-all"
                              >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                    {/* Friends List */}
                    <div className="space-y-4">
                      <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-2">My Friends ({friends.length})</h3>
                      {friends.length === 0 && (
                        <p className="text-sm text-gray-500 dark:text-gray-400 py-4 italic">You haven't added any friends yet.</p>
                      )}
                      {friends.map(friend => (
                        <div key={friend.friendship_id} className="flex items-center justify-between p-4 rounded-xl glass-card group hover:shadow-[0_0_15px_rgba(0,255,198,0.2)] transition-all">
                          <a href={`/student/${friend.username || friend.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 rounded-full gradient-bg flex items-center justify-center text-[var(--background)] text-lg font-bold shrink-0">
                              {friend.profile_photo ? <img src={friend.profile_photo} className="w-full h-full object-cover rounded-full" /> : friend.name?.[0]}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--text)] truncate">{friend.name}</p>
                              <p className="text-xs text-[var(--cyan)]">@{friend.username || 'No username'}</p>
                            </div>
                          </a>
                          <button
                            onClick={() => unfriend(friend.friendship_id)}
                            className="opacity-0 group-hover:opacity-100 p-2 text-red-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/10 rounded-lg transition-all"
                          >
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Pending Requests */}
                    <div className="space-y-6">
                      <div>
                        <h3 className="text-sm font-bold uppercase tracking-wider text-amber-500 mb-4 flex items-center gap-2">
                          Pending Requests
                          {pendingRequests.length > 0 && (
                            <span className="bg-[var(--accent)]/20 text-[var(--accent)] px-2 py-0.5 rounded-full text-[10px]">{pendingRequests.length}</span>
                          )}
                        </h3>
                        {pendingRequests.length === 0 && (
                           <p className="text-sm text-[var(--muted)] py-2 italic font-medium">No incoming requests.</p>
                        )}
                        <div className="space-y-3">
                          {pendingRequests.map(req => (
                            <div key={req.friendship_id} className="flex items-center justify-between p-3 rounded-xl bg-[var(--surface-2)] border border-[var(--border)] group">
                              <div className="flex items-center gap-3 min-w-0 flex-1">
                                <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-[var(--background)] text-xs font-bold shrink-0">
                                  {req.profile_photo ? <img src={req.profile_photo} className="w-full h-full object-cover rounded-full" /> : req.name?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-[var(--text)] truncate">{req.name}</p>
                                  <p className="text-[10px] text-[var(--muted)]">wants to be friends</p>
                                </div>
                              </div>
                              <div className="flex gap-1">
                                <button
                                  onClick={() => acceptFriendRequest(req.friendship_id)}
                                  className="p-1.5 rounded-lg bg-[var(--emerald)]/20 text-[var(--emerald)] hover:bg-[var(--emerald)] hover:text-[var(--background)] transition-colors"
                                  title="Accept"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                                  </svg>
                                </button>
                                <button
                                  onClick={() => rejectFriendRequest(req.friendship_id)}
                                  className="p-1.5 rounded-lg bg-red-500/20 text-red-500 hover:bg-red-500 hover:text-[var(--background)] transition-colors"
                                  title="Reject"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Sent Requests */}
                      {sentRequests.length > 0 && (
                        <div>
                          <h3 className="text-sm font-bold uppercase tracking-wider text-gray-400 mb-4">Sent Requests</h3>
                          <div className="space-y-3">
                            {sentRequests.map(req => (
                              <div key={req.friendship_id} className="flex items-center gap-3 p-3 rounded-xl bg-[var(--surface-2)] border-[var(--border)]/50 border opacity-75">
                                <div className="w-8 h-8 rounded-full gradient-bg flex items-center justify-center text-[var(--background)] text-xs font-bold shrink-0">
                                  {req.profile_photo ? <img src={req.profile_photo} className="w-full h-full object-cover rounded-full" /> : req.name?.[0]}
                                </div>
                                <div className="flex-1 min-w-0">
                                  <p className="text-xs font-bold text-[var(--text)] truncate">{req.name}</p>
                                  <p className="text-[10px] text-[var(--muted)] italic">Waiting for response...</p>
                                </div>
                                <button
                                   onClick={() => unfriend(req.friendship_id)}
                                   className="p-1.5 text-[var(--muted)] hover:text-red-500"
                                   title="Cancel Request"
                                >
                                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      )}

      {/* Full Analysis Modal */}
      <AnimatePresence>
        {showAnalysisModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md"
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              className="glass-card w-full max-w-2xl p-6 md:p-8 max-h-[85vh] overflow-y-auto relative border border-white/20 shadow-2xl flex flex-col justify-between"
            >
              {/* Close Button */}
              <button
                onClick={() => setShowAnalysisModal(false)}
                className="absolute top-4 right-4 p-2 text-gray-400 hover:text-white rounded-lg hover:bg-white/10 transition-colors"
              >
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>

              {/* Header */}
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-500 to-accent-500 flex items-center justify-center text-white shadow-lg">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                </div>
                <div>
                  <h2 className="text-xl font-display font-black text-white">Mellow AI Career Analysis</h2>
                  <p className="text-xs text-gray-400 font-medium">Detailed breakdown of your placement readiness & digital profile score</p>
                </div>
              </div>

              {/* Score Summary Section */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-6 rounded-2xl bg-[var(--surface-2)]/50 border border-white/5 mb-6">
                {/* Gauge */}
                <div className="flex flex-col items-center justify-center md:border-r border-white/10 md:pr-6">
                  <div className="relative w-28 h-28 flex items-center justify-center">
                    <svg className="w-full h-full transform -rotate-90">
                      <circle cx="56" cy="56" r="48" className="stroke-[var(--surface-2)]" strokeWidth="8" fill="none" />
                      <circle cx="56" cy="56" r="48" className="stroke-primary-500 transition-all duration-1000" strokeWidth="8" fill="none" strokeLinecap="round" strokeDasharray="301.6" strokeDashoffset={301.6 - (301.6 * completionPercent) / 100} />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-2xl font-display font-black text-white">{completionPercent}</span>
                      <span className="text-[10px] font-bold text-primary-400">/ 100</span>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-gray-300 mt-2">Academic Score</span>
                </div>

                {/* Score breakdown metrics list */}
                <div className="md:col-span-2 space-y-3">
                  <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Score Breakdown</h4>
                  
                  <div className="space-y-2 text-xs">
                    {/* Metric 1: Core profile */}
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Profile Basic Info (Name, Photo, Bio, Username):</span>
                      <span className="font-bold text-white">
                        {((profile.name ? 5 : 0) + (profile.username ? 5 : 0) + (profile.role ? 5 : 0) + (profile.about ? 5 : 0) + (profile.profile_photo ? 10 : 0) + (profile.github ? 5 : 0) + (profile.linkedin ? 5 : 0))} / 40 pts
                      </span>
                    </div>
                    
                    {/* Metric 2: Education */}
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Education Details:</span>
                      <span className="font-bold text-white">
                        {((profile.college ? 5 : 0) + (profile.degree ? 5 : 0) + (profile.year ? 5 : 0))} / 15 pts
                      </span>
                    </div>

                    {/* Metric 3: Skills */}
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Verified Skills (up to 5):</span>
                      <span className="font-bold text-white">
                        {Math.min(15, (skills || []).length * 3)} / 15 pts
                      </span>
                    </div>

                    {/* Metric 4: Projects & Certifications */}
                    <div className="flex justify-between items-center text-gray-300">
                      <span>Projects & Certs (up to 2 each):</span>
                      <span className="font-bold text-white">
                        {(Math.min(20, (projects || []).length * 10) + Math.min(10, (certificates || []).length * 5))} / 30 pts
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Active Insights Analysis */}
              <div className="space-y-4 mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Active Insights Analysis</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {insights.map((insight, idx) => (
                    <div key={idx} className="p-4 rounded-xl bg-[var(--surface-2)] border border-white/5 relative overflow-hidden flex flex-col justify-between min-h-[160px]">
                      <div className={`absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-primary-500 to-accent-500`}></div>
                      <div>
                        <h5 className="font-bold text-white text-sm mb-1">{insight.title || "Career Insight"}</h5>
                        <p className="text-[11px] text-gray-400 leading-relaxed mb-4">{insight.detail || insight.text}</p>
                      </div>
                      {insight.actionLabel && (
                        <div>
                          <button
                            onClick={() => {
                              setShowAnalysisModal(false);
                              setIsEditing(true);
                              if (insight.actionTab) {
                                setActiveTab(insight.actionTab);
                              }
                            }}
                            className="px-3 py-1.5 bg-white/5 hover:bg-white/10 text-primary-400 hover:text-primary-300 font-bold text-xs rounded-lg transition-colors border border-white/5"
                          >
                            {insight.actionLabel} &rarr;
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommendations List */}
              <div className="space-y-4 mb-6">
                <h4 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Recommended Actions</h4>
                
                <div className="space-y-2.5 max-h-[30vh] overflow-y-auto pr-2">
                  {/* Username Check */}
                  {!profile.username && (
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300 text-xs leading-relaxed">
                      <span className="text-base leading-none">⚠️</span>
                      <div>
                        <p className="font-bold mb-0.5">Set a custom username</p>
                        <p className="text-amber-400/80 font-medium">Crucial for claiming your public URL and sharing your profile with recruiters.</p>
                      </div>
                    </div>
                  )}

                  {/* Photo Check */}
                  {!profile.profile_photo && (
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-300 text-xs leading-relaxed">
                      <span className="text-base leading-none">📸</span>
                      <div>
                        <p className="font-bold mb-0.5">Upload a profile photo</p>
                        <p className="text-sky-400/80 font-medium">Adding a face to your digital resume increases hiring views by over 500%.</p>
                      </div>
                    </div>
                  )}

                  {/* About Check */}
                  {!profile.about && (
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300 text-xs leading-relaxed">
                      <span className="text-base leading-none">✍️</span>
                      <div>
                        <p className="font-bold mb-0.5">Write your bio</p>
                        <p className="text-purple-400/80 font-medium">Tell recruiters your career goals and what technologies you are passionate about.</p>
                      </div>
                    </div>
                  )}

                  {/* GitHub/LinkedIn Check */}
                  {(!profile.github || !profile.linkedin) && (
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs leading-relaxed">
                      <span className="text-base leading-none">🔗</span>
                      <div>
                        <p className="font-bold mb-0.5">Link professional accounts</p>
                        <p className="text-emerald-400/80 font-medium">Connecting GitHub or LinkedIn allows direct code & resume vetting.</p>
                      </div>
                    </div>
                  )}

                  {/* Skills check */}
                  {(skills || []).length < 3 && (
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs leading-relaxed">
                      <span className="text-base leading-none">⚡</span>
                      <div>
                        <p className="font-bold mb-0.5">Add more skills (Goal: 3+)</p>
                        <p className="text-indigo-400/80 font-medium">Include technical tags (React, Node, SQL) to show up in recruiter keyword search triggers.</p>
                      </div>
                    </div>
                  )}

                  {/* Projects check */}
                  {(projects || []).length === 0 && (
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs leading-relaxed">
                      <span className="text-base leading-none">🚀</span>
                      <div>
                        <p className="font-bold mb-0.5">Add a project showpiece</p>
                        <p className="text-rose-400/80 font-medium">Recruiters focus heavily on projects. Add a description and code repository link.</p>
                      </div>
                    </div>
                  )}

                  {/* Certificates check */}
                  {(certificates || []).length === 0 && (
                    <div className="flex items-start gap-3 p-3.5 rounded-xl bg-yellow-500/10 border border-yellow-500/20 text-yellow-300 text-xs leading-relaxed">
                      <span className="text-base leading-none">📜</span>
                      <div>
                        <p className="font-bold mb-0.5">Add verified certifications</p>
                        <p className="text-yellow-400/80 font-medium">Upload certificates to provide third-party validation of your skills.</p>
                      </div>
                    </div>
                  )}

                  {/* Perfect score case */}
                  {profile.username && profile.profile_photo && profile.about && profile.github && profile.linkedin && (skills || []).length >= 3 && (projects || []).length > 0 && (certificates || []).length > 0 && (
                    <div className="flex items-center justify-center p-8 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs text-center font-bold">
                      🎉 Awesome job! Your profile meets all our AI readiness requirements. You are fully optimized for recruiter visibility!
                    </div>
                  )}
                </div>
              </div>

              {/* Footer Action */}
              <button
                onClick={() => {
                  setShowAnalysisModal(false);
                  setIsEditing(true);
                }}
                className="w-full py-3.5 bg-gradient-to-r from-primary-500 to-accent-500 text-white font-bold rounded-xl text-sm shadow-lg hover:brightness-110 active:scale-98 transition-all"
              >
                Edit Profile to Increase Score
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      </div>
    </div>
  )
}
