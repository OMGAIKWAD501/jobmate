import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { motion } from 'framer-motion';
import MapUI from '../components/MapUI';
import ReviewModal from '../components/ReviewModal';
import './Dashboard.css';

const Dashboard = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    location: '',
    budget: '',
    duration: ''
  });
  
  const [reviewModalOpen, setReviewModalOpen] = useState(false);
  const [selectedJobForReview, setSelectedJobForReview] = useState(null);
  
  const [editingJobId, setEditingJobId] = useState(null);
  const [editJobForm, setEditJobForm] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    location: '',
    budget: '',
    duration: ''
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await axios.get('/api/auth/profile');
        setProfile(response.data);
        setFormData(response.data.user);
      } catch (error) {
        console.error('Error fetching profile:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchJobs = async () => {
      try {
        if (user.role === 'customer') {
          const response = await axios.get('/api/jobs');
          setJobs(response.data.jobs);
        }
      } catch (error) {
        console.error('Error fetching jobs:', error);
      }
    };

    const fetchApplications = async () => {
      try {
        if (user.role === 'worker') {
          const response = await axios.get('/api/jobs');
          const userApplications = [];
          response.data.jobs.forEach(job => {
            job.applications.forEach(app => {
              if (app.worker === user.id || app.worker === user._id) {
                userApplications.push({
                  ...app,
                  jobTitle: job.title,
                  jobId: job._id,
                  customerName: job.customer.name || 'Customer',
                  status: app.status
                });
              }
            });
          });
          setApplications(userApplications);
        }
      } catch (error) {
        console.error('Error fetching applications:', error);
      }
    };

    if (user) {
      fetchProfile();
      fetchJobs();
      fetchApplications();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSkillsChange = (e) => {
    const skills = e.target.value.split(',').map(skill => skill.trim());
    setFormData(prev => ({
      ...prev,
      skills
    }));
  };

  const handleJobFormChange = (e) => {
    const { name, value } = e.target;
    setJobForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (user.role === 'worker') {
        await axios.put('/api/workers/profile', formData);
      }
      setProfile(prev => ({
        ...prev,
        user: formData
      }));
      setEditing(false);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error('Error updating profile:', error);
      alert('Error updating profile');
    }
  };

  const handleCreateJob = async (e) => {
    e.preventDefault();
    try {
      const jobData = {
        title: jobForm.title,
        description: jobForm.description,
        requiredSkills: jobForm.requiredSkills.split(',').map(skill => skill.trim()).filter(Boolean),
        location: jobForm.location,
      };
      
      if (jobForm.budget) jobData.budget = parseFloat(jobForm.budget);
      if (jobForm.duration) jobData.duration = jobForm.duration;

      await axios.post('/api/jobs', jobData);
      const response = await axios.get('/api/jobs');
      setJobs(response.data.jobs);
      
      setJobForm({
        title: '', description: '', requiredSkills: '',
        location: '', budget: '', duration: ''
      });
      setShowJobForm(false);
      alert('Job posted successfully!');
    } catch (error) {
      console.error('Error creating job:', error);
      alert('Error creating job');
    }
  };

  const handleEditJobClick = (job) => {
    setEditingJobId(job._id);
    setEditJobForm({
      title: job.title,
      description: job.description,
      requiredSkills: job.requiredSkills.join(', '),
      location: job.location,
      budget: job.budget || '',
      duration: job.duration || ''
    });
  };

  const handleEditJobCancel = () => setEditingJobId(null);

  const handleEditJobChange = (e) => {
    const { name, value } = e.target;
    setEditJobForm(prev => ({ ...prev, [name]: value }));
  };

  const handleUpdateJob = async (e) => {
    e.preventDefault();
    try {
      const jobData = {
        title: editJobForm.title,
        description: editJobForm.description,
        requiredSkills: editJobForm.requiredSkills.split(',').map(skill => skill.trim()).filter(Boolean),
        location: editJobForm.location,
      };

      if (editJobForm.budget) jobData.budget = parseFloat(editJobForm.budget);
      if (editJobForm.duration) jobData.duration = editJobForm.duration;

      await axios.put(`/api/jobs/${editingJobId}`, jobData);
      const response = await axios.get('/api/jobs');
      setJobs(response.data.jobs);
      
      setEditingJobId(null);
      alert('Job updated successfully!');
    } catch (error) {
      console.error('Error updating job:', error);
      alert(error.response?.data?.message || 'Error updating job');
    }
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return;
    }
    
    try {
      await axios.delete(`/api/jobs/${id}`);
      setJobs(jobs.filter(job => job._id !== id));
      alert('Job deleted successfully!');
    } catch (error) {
      console.error('Error deleting job:', error);
      alert(error.response?.data?.message || 'Error deleting job');
    }
  };

  const handleAcceptApplication = async (jobId, applicationId) => {
    try {
      await axios.put(`/api/jobs/${jobId}/applications/${applicationId}/accept`);
      const response = await axios.get('/api/jobs');
      setJobs(response.data.jobs);
      alert('Application accepted!');
    } catch (error) {
      console.error('Error accepting application:', error);
      alert(error.response?.data?.message || 'Error accepting application');
    }
  };

  const handleOpenReviewModal = (job) => {
    setSelectedJobForReview(job);
    setReviewModalOpen(true);
  };

  if (loading) {
    return (
      <div className="container" style={{ paddingTop: '60px' }}>
         <motion.div 
           initial={{ opacity: 0 }} animate={{ opacity: 1 }} 
           className="dashboard-grid-skeleton"
         >
           <div className="glass-panel" style={{ height: '500px', animation: 'pulse 1.5s infinite' }} />
           <div className="glass-panel" style={{ height: '700px', animation: 'pulse 1.5s infinite' }} />
         </motion.div>
      </div>
    );
  }

  if (!profile) return <div className="error glass-panel container mt-40">Unable to load profile</div>;

  return (
    <motion.div 
      className="dashboard"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      <div className="container">
        <h1 className="page-title">Dashboard</h1>
        
        <div className="dashboard-content dashboard-grid">
          <motion.div className="profile-section glass-panel" layout>
            <div className="section-header">
              <h2>Profile Information</h2>
              <button 
                onClick={() => setEditing(!editing)} 
                className="btn-secondary"
              >
                {editing ? 'Cancel' : 'Edit Profile'}
              </button>
            </div>

            {editing ? (
              <form onSubmit={handleSubmit} className="profile-form">
                <div className="form-group">
                  <label>Name:</label>
                  <input type="text" name="name" value={formData.name || ''} onChange={handleInputChange} required className="text-input" />
                </div>
                
                <div className="form-group">
                  <label>Email:</label>
                  <input type="email" name="email" value={formData.email || ''} onChange={handleInputChange} required className="text-input" />
                </div>
                
                <div className="form-group">
                  <label>Phone:</label>
                  <input type="tel" name="phone" value={formData.phone || ''} onChange={handleInputChange} className="text-input" />
                </div>
                
                <div className="form-group">
                  <label>Location:</label>
                  <input type="text" name="location" value={formData.location || ''} onChange={handleInputChange} className="text-input" />
                </div>

                {user.role === 'worker' && (
                  <>
                    <div className="form-group">
                      <label>Skills (comma-separated):</label>
                      <input type="text" value={formData.skills?.join(', ') || ''} onChange={handleSkillsChange} placeholder="e.g., plumbing, electrical" className="text-input" />
                    </div>
                    
                    <div className="form-group">
                      <label>Experience (years):</label>
                      <input type="number" name="experience" value={formData.experience || 0} onChange={handleInputChange} min="0" className="text-input" />
                    </div>
                    
                    <div className="form-group">
                      <label>Hourly Rate ($):</label>
                      <input type="number" name="hourlyRate" value={formData.hourlyRate || ''} onChange={handleInputChange} min="0" className="text-input" />
                    </div>
                    
                    <div className="form-group">
                      <label>Description:</label>
                      <textarea name="description" value={formData.description || ''} onChange={handleInputChange} rows="4" className="text-input" />
                    </div>
                  </>
                )}
                <button type="submit" className="btn-primary mt-10">Save Changes</button>
              </form>
            ) : (
              <div className="profile-display text-body">
                <p><strong>Name:</strong> {profile.user.name}</p>
                <p><strong>Email:</strong> {profile.user.email}</p>
                <p><strong>Role:</strong> <span className="stat-pill">{profile.user.role}</span></p>
                {profile.user.phone && <p><strong>Phone:</strong> {profile.user.phone}</p>}
                {profile.user.location && <p><strong>Location:</strong> {profile.user.location}</p>}
                
                {user.role === 'worker' && profile.workerDetails && (
                  <>
                    <p style={{ marginTop: '10px' }}><strong>Skills:</strong></p>
                    <div className="flex-wrap-gap mb-10">
                      {profile.workerDetails.skills.map(s => <span key={s} className="skill-tag">{s}</span>)}
                    </div>
                    <p><strong>Experience:</strong> {profile.workerDetails.experience} years</p>
                    {profile.workerDetails.hourlyRate && <p><strong>Hourly Rate:</strong> <span className="text-green">${profile.workerDetails.hourlyRate}</span></p>}
                    {profile.workerDetails.description && <p><strong>Description:</strong> {profile.workerDetails.description}</p>}
                    <p className="mt-10"><strong>Rating:</strong> ⭐ {profile.workerDetails.rating.toFixed(1)}</p>
                    <p><strong>Jobs Completed:</strong> {profile.workerDetails.completedJobs}</p>
                  </>
                )}
              </div>
            )}
            
            {user.role === 'customer' && jobs.length > 0 && (
              <div className="mt-30 glass-subpanel">
                <h3 className="mb-15">Job Map</h3>
                <MapUI jobs={jobs} />
              </div>
            )}
          </motion.div>

          {user.role === 'customer' && (
            <motion.div className="jobs-section glass-panel" layout>
              <div className="section-header">
                <h2>My Job Postings</h2>
                <button onClick={() => setShowJobForm(!showJobForm)} className="btn-primary">
                  {showJobForm ? 'Cancel' : 'Post New Job'}
                </button>
              </div>

              {showJobForm && (
                <form onSubmit={handleCreateJob} className="job-form glass-subpanel mb-30">
                  <div className="form-group">
                    <label>Job Title:</label>
                    <input type="text" name="title" value={jobForm.title} onChange={handleJobFormChange} required placeholder="e.g., Fix Kitchen Sink" className="text-input" />
                  </div>
                  
                  <div className="form-group">
                    <label>Description:</label>
                    <textarea name="description" value={jobForm.description} onChange={handleJobFormChange} required rows="4" className="text-input" />
                  </div>
                  
                  <div className="form-group">
                    <label>Required Skills (comma-separated):</label>
                    <input type="text" name="requiredSkills" value={jobForm.requiredSkills} onChange={handleJobFormChange} required placeholder="e.g., plumbing" className="text-input" />
                  </div>
                  
                  <div className="form-group">
                    <label>Location:</label>
                    <input type="text" name="location" value={jobForm.location} onChange={handleJobFormChange} required placeholder="e.g., New York, NY" className="text-input" />
                  </div>
                  
                  <div className="form-group">
                    <label>Budget ($):</label>
                    <input type="number" name="budget" value={jobForm.budget} onChange={handleJobFormChange} min="0" placeholder="e.g., 150" className="text-input" />
                  </div>
                  
                  <div className="form-group">
                    <label>Duration:</label>
                    <input type="text" name="duration" value={jobForm.duration} onChange={handleJobFormChange} placeholder="e.g., 2 hours" className="text-input" />
                  </div>
                  
                  <button type="submit" className="btn-primary mt-10 w-full">Post Job</button>
                </form>
              )}

              <div className="jobs-list list-gap mt-20">
                {jobs.map((job, idx) => (
                  <motion.div key={job._id} className="job-card glass-subpanel" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                    {editingJobId === job._id ? (
                      <form onSubmit={handleUpdateJob} className="job-form">
                        <h3 className="mb-10">Edit Job</h3>
                        <div className="form-group">
                          <label>Job Title:</label>
                          <input type="text" name="title" value={editJobForm.title} onChange={handleEditJobChange} required className="text-input" />
                        </div>
                        <div className="form-group">
                          <label>Description:</label>
                          <textarea name="description" value={editJobForm.description} onChange={handleEditJobChange} required rows="4" className="text-input" />
                        </div>
                        <div className="form-group">
                          <label>Required Skills (comma-separated):</label>
                          <input type="text" name="requiredSkills" value={editJobForm.requiredSkills} onChange={handleEditJobChange} required className="text-input" />
                        </div>
                        <div className="form-group">
                          <label>Location:</label>
                          <input type="text" name="location" value={editJobForm.location} onChange={handleEditJobChange} required className="text-input" />
                        </div>
                        <div className="form-group">
                          <label>Budget ($):</label>
                          <input type="number" name="budget" value={editJobForm.budget} onChange={handleEditJobChange} min="0" className="text-input" />
                        </div>
                        <div className="form-group">
                          <label>Duration:</label>
                          <input type="text" name="duration" value={editJobForm.duration} onChange={handleEditJobChange} className="text-input" />
                        </div>
                        <div className="flex-gap mt-10">
                          <button type="submit" className="btn-primary">Update</button>
                          <button type="button" className="btn-secondary" onClick={handleEditJobCancel}>Cancel</button>
                        </div>
                      </form>
                    ) : (
                      <>
                        <div className="flex-between align-start mb-10">
                          <h3 className="m-0 text-active" style={{ fontSize: '1.25rem' }}>{job.title}</h3>
                          {job.status === 'open' && (
                            <div className="flex-gap" style={{ gap: '10px' }}>
                              <button onClick={() => handleEditJobClick(job)} className="btn-secondary text-xs">Edit</button>
                              <button onClick={() => handleDeleteJob(job._id)} className="btn-secondary text-xs" style={{ borderColor: 'rgba(239, 68, 68, 0.3)', color: '#F87171' }}>Delete</button>
                            </div>
                          )}
                        </div>
                        <p className="text-muted"><span className="icon">📍</span> {job.location}</p>
                        <p className="font-bold text-green mt-10">${job.budget}</p>
                        <p className="mt-10"><strong>Status:</strong> <span className={`status-badge ${job.status}`}>{job.status}</span></p>
                        
                        {job.applications.length > 0 && (
                          <div className="applications glass-subpanel mt-20">
                            <h4>Applications ({job.applications.length})</h4>
                            <div className="list-gap mt-10">
                               {job.applications.map(app => (
                                <div key={app._id} className="application border-left-accent p-10">
                                  <p className="text-active"><strong>Worker:</strong> {app.worker?.name || 'Worker'}</p>
                                  <p className="text-body my-10 italic">"{app.message}"</p>
                                  <p className="text-sm"><strong>Status:</strong> <span className="capitalize text-muted">{app.status}</span></p>
                                  {app.status === 'pending' && (
                                    <button onClick={() => handleAcceptApplication(job._id, app._id)} className="btn-primary mt-10 text-sm">
                                      Accept Application
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </div>
                        )}
                        
                        {job.status === 'assigned' && (
                           <button onClick={() => handleOpenReviewModal(job)} className="btn-primary mt-20" style={{ background: '#10B981', borderColor: '#10B981' }}>
                             Complete Job & Leave Review
                           </button>
                        )}
                      </>
                    )}
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {user.role === 'worker' && (
            <motion.div className="applications-section glass-panel" layout>
              <h2 className="section-header">My Applications</h2>
              <div className="applications-list list-gap mt-20">
                {applications.map((app, idx) => (
                  <motion.div 
                    key={app._id} 
                    className="application-card glass-subpanel"
                    initial={{ opacity: 0, y: 15 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.1 }}
                  >
                    <h3 className="text-active mb-10">{app.jobTitle}</h3>
                    <p className="text-muted mb-10"><strong className="text-body">Customer:</strong> {app.customerName}</p>
                    <p className="text-body italic mb-10">"{app.message}"</p>
                    <div className="flex-between align-center mt-15 border-top pt-15">
                        <span className={`status-badge ${app.status}`}>{app.status}</span>
                        <span className="text-xs text-muted">Applied: {new Date(app.appliedAt).toLocaleDateString()}</span>
                    </div>
                  </motion.div>
                ))}
                {applications.length === 0 && <p className="text-muted italic">You haven't applied to any jobs yet.</p>}
              </div>
            </motion.div>
          )}
        </div>
      </div>
      
      <ReviewModal 
        isOpen={reviewModalOpen} 
        onClose={() => setReviewModalOpen(false)} 
        job={selectedJobForReview}
        onReviewSubmitted={() => {
           axios.get('/api/jobs').then(res => setJobs(res.data.jobs));
        }}
      />
    </motion.div>
  );
};

export default Dashboard;