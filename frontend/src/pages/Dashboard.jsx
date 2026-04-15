import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import API_URL from '../config';
import { motion } from 'framer-motion';
import NearbyWorkers from '../components/NearbyWorkers';
import ReviewModal from '../components/ReviewModal';
import JobJourneyCard from '../components/JobJourneyCard';
import './Dashboard.css';

const Dashboard = () => {
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [profileFeedback, setProfileFeedback] = useState({ type: '', message: '' });
  const [savingLocation, setSavingLocation] = useState(false);
  const [locationFeedback, setLocationFeedback] = useState({ type: '', message: '' });
  const [editing, setEditing] = useState(false);
  const [formData, setFormData] = useState({});
  const [jobs, setJobs] = useState([]);
  const [applications, setApplications] = useState([]);
  const [directRequests, setDirectRequests] = useState([]);
  const [showJobForm, setShowJobForm] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    description: '',
    requiredSkills: '',
    location: '',
    budget: '',
    duration: ''
  });
  const [jobCoordinates, setJobCoordinates] = useState(null);
  const [savingJobLocation, setSavingJobLocation] = useState(false);
  const [jobLocationFeedback, setJobLocationFeedback] = useState({ type: '', message: '' });

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
  const [editJobCoordinates, setEditJobCoordinates] = useState(null);
  const [savingEditJobLocation, setSavingEditJobLocation] = useState(false);
  const [editJobLocationFeedback, setEditJobLocationFeedback] = useState({ type: '', message: '' });

  const [activeTab, setActiveTab] = useState(user?.role === 'worker' ? 'applications' : 'jobs');

  const fetchProfile = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${API_URL}/api/auth/profile`);
      setProfile(response.data);
      setFormData({
        ...response.data.user,
        ...(response.data.workerDetails || {})
      });
    } catch (error) {
      console.error('Error fetching profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchJobs = async () => {
    if (!user) return;
    try {
      if (user.role === 'customer') {
        const response = await axios.get(`${API_URL}/api/jobs?status=all`);
        console.log('API Response (customer jobs):', response.data);
        const fetchedJobs = Array.isArray(response.data.jobs) ? response.data.jobs : [];
        const customerId = user._id || user.id;
        const myJobs = fetchedJobs.filter(j => {
          const isOwnJob = (j.customer?._id || j.customer) === customerId;
          const isDirectRequest = j.isDirectRequest === true || j.status === 'pending' || (j.assignedWorker && (!j.applications || j.applications.length === 0) && j.status !== 'open');
          return isOwnJob && !isDirectRequest;
        });
        setJobs(myJobs);
      }
    } catch (error) {
      console.error('Error fetching jobs:', error);
    }
  };

  const fetchApplications = async () => {
    if (!user) return;
    try {
      if (user.role === 'worker') {
        const response = await axios.get(`${API_URL}/api/jobs?status=all`);
        console.log('API Response (worker applications):', response.data);
        const fetchedJobs = Array.isArray(response.data.jobs) ? response.data.jobs : [];
        const userApplications = [];
        fetchedJobs.forEach(job => {
          if (Array.isArray(job.applications)) {
            job.applications.forEach(app => {
            const workerId = typeof app.worker === 'object' ? String(app.worker._id) : String(app.worker);
            const currentUserId = String(user.id || user._id);
            if (workerId === currentUserId) {
              userApplications.push({
                ...app,
                jobTitle: job.title,
                jobId: job._id,
                customerName: job.customer?.name || 'Customer',
                status: app.status
              });
            }
          });
          }
        });
        setApplications(userApplications);
      }
    } catch (error) {
      console.error('Error fetching applications:', error);
    }
  };
  
  const fetchDirectRequests = async () => {
    if (!user) return;
    try {
      const response = await axios.get(`${API_URL}/api/jobs/direct-requests`);
      console.log('API Response (direct requests):', response.data);
      setDirectRequests(Array.isArray(response.data.jobs) ? response.data.jobs : []);
    } catch (error) {
      console.error('Error fetching direct requests:', error);
    }
  };

  useEffect(() => {
    if (user) {
      fetchProfile();
      fetchJobs();
      fetchApplications();
      fetchDirectRequests();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [user, authLoading]);

  useEffect(() => {
    if (!profileFeedback.message) return undefined;

    const timer = setTimeout(() => {
      setProfileFeedback({ type: '', message: '' });
    }, 4000);

    return () => clearTimeout(timer);
  }, [profileFeedback]);

  useEffect(() => {
    if (!locationFeedback.message) return undefined;

    const timer = setTimeout(() => {
      setLocationFeedback({ type: '', message: '' });
    }, 3000);

    return () => clearTimeout(timer);
  }, [locationFeedback]);

  useEffect(() => {
    if (!jobLocationFeedback.message) return undefined;

    const timer = setTimeout(() => {
      setJobLocationFeedback({ type: '', message: '' });
    }, 3000);

    return () => clearTimeout(timer);
  }, [jobLocationFeedback]);

  useEffect(() => {
    if (!editJobLocationFeedback.message) return undefined;

    const timer = setTimeout(() => {
      setEditJobLocationFeedback({ type: '', message: '' });
    }, 3000);

    return () => clearTimeout(timer);
  }, [editJobLocationFeedback]);

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
    if (name === 'location') {
      setJobCoordinates(null);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (savingProfile) return;
    setSavingProfile(true);
    setProfileFeedback({ type: '', message: '' });

    try {
      if (user.role === 'worker') {
        const workerData = {
          skills: formData.skills || [],
          experience: formData.experience,
          hourlyRate: formData.hourlyRate,
          description: formData.description,
          availability: formData.availability
        };
        // Remove undefined fields
        Object.keys(workerData).forEach(key => workerData[key] === undefined && delete workerData[key]);

        await axios.put(`${API_URL}/api/workers/profile`, workerData);
      }

      // Re-fetch profile to keep dashboard state consistent and avoid stale UI crashes.
      const refreshedProfile = await axios.get(`${API_URL}/api/auth/profile`);
      setProfile(refreshedProfile.data);
      setFormData({
        ...refreshedProfile.data.user,
        ...(refreshedProfile.data.workerDetails || {})
      });

      setEditing(false);
      setProfileFeedback({ type: 'success', message: 'Profile updated successfully.' });
    } catch (error) {
      console.error('Error updating profile:', error);
      setProfileFeedback({
        type: 'error',
        message: error.response?.data?.message || 'Error updating profile'
      });
    } finally {
      setSavingProfile(false);
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
      if (jobCoordinates?.lat && jobCoordinates?.lng) {
        jobData.lat = jobCoordinates.lat;
        jobData.lng = jobCoordinates.lng;
      }

      if (jobForm.budget) jobData.budget = parseFloat(jobForm.budget);
      if (jobForm.duration) jobData.duration = jobForm.duration;

      await axios.post(`${API_URL}/api/jobs`, jobData);
      const response = await axios.get(`${API_URL}/api/jobs`);
      setJobs(Array.isArray(response.data.jobs) ? response.data.jobs : []);

      setJobForm({
        title: '', description: '', requiredSkills: '',
        location: '', budget: '', duration: ''
      });
      setJobCoordinates(null);
      setJobLocationFeedback({ type: '', message: '' });
      setShowJobForm(false);
      alert('Job posted successfully!');
    } catch (error) {
      console.error('Error creating job:', error);
      alert(error.response?.data?.message || 'Error creating job');
    }
  };

  const handleShareJobLocation = () => {
    if (savingJobLocation) return;
    if (!navigator.geolocation) {
      setJobLocationFeedback({ type: 'error', message: 'Geolocation is not supported by your browser.' });
      return;
    }

    setSavingJobLocation(true);
    setJobLocationFeedback({ type: '', message: '' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCoordinates = {
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude)
        };
        setJobCoordinates(nextCoordinates);

        try {
          const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: {
              format: 'json',
              lat: nextCoordinates.lat,
              lon: nextCoordinates.lng
            }
          });
          const address = response?.data?.display_name;
          if (address) {
            setJobForm((prev) => ({ ...prev, location: address }));
          } else {
            setJobForm((prev) => ({ ...prev, location: `${nextCoordinates.lat.toFixed(5)}, ${nextCoordinates.lng.toFixed(5)}` }));
          }
        } catch (error) {
          setJobForm((prev) => ({ ...prev, location: `${nextCoordinates.lat.toFixed(5)}, ${nextCoordinates.lng.toFixed(5)}` }));
          console.error('Error reverse geocoding job location:', error);
        } finally {
          setJobLocationFeedback({ type: 'success', message: 'Current location shared for this job.' });
          setSavingJobLocation(false);
        }
      },
      () => {
        setJobLocationFeedback({ type: 'error', message: 'Unable to access your current location.' });
        setSavingJobLocation(false);
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 60000 }
    );
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
    setEditJobCoordinates(null);
    setEditJobLocationFeedback({ type: '', message: '' });
  };

  const handleEditJobCancel = () => {
    setEditingJobId(null);
    setEditJobCoordinates(null);
    setEditJobLocationFeedback({ type: '', message: '' });
  };

  const handleEditJobChange = (e) => {
    const { name, value } = e.target;
    setEditJobForm(prev => ({ ...prev, [name]: value }));
    if (name === 'location') {
      setEditJobCoordinates(null);
    }
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
      if (editJobCoordinates?.lat && editJobCoordinates?.lng) {
        jobData.lat = editJobCoordinates.lat;
        jobData.lng = editJobCoordinates.lng;
      }

      if (editJobForm.budget) jobData.budget = parseFloat(editJobForm.budget);
      if (editJobForm.duration) jobData.duration = editJobForm.duration;

      await axios.put(`${API_URL}/api/jobs/${editingJobId}`, jobData);
      const response = await axios.get(`${API_URL}/api/jobs`);
      setJobs(Array.isArray(response.data.jobs) ? response.data.jobs : []);

      setEditingJobId(null);
      setEditJobCoordinates(null);
      setEditJobLocationFeedback({ type: '', message: '' });
      alert('Job updated successfully!');
    } catch (error) {
      console.error('Error updating job:', error);
      alert(error.response?.data?.message || 'Error updating job');
    }
  };

  const handleShareEditJobLocation = () => {
    if (savingEditJobLocation) return;
    if (!navigator.geolocation) {
      setEditJobLocationFeedback({ type: 'error', message: 'Geolocation is not supported by your browser.' });
      return;
    }

    setSavingEditJobLocation(true);
    setEditJobLocationFeedback({ type: '', message: '' });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const nextCoordinates = {
          lat: Number(position.coords.latitude),
          lng: Number(position.coords.longitude)
        };
        setEditJobCoordinates(nextCoordinates);

        try {
          const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
            params: {
              format: 'json',
              lat: nextCoordinates.lat,
              lon: nextCoordinates.lng
            }
          });
          const address = response?.data?.display_name;
          if (address) {
            setEditJobForm((prev) => ({ ...prev, location: address }));
          } else {
            setEditJobForm((prev) => ({ ...prev, location: `${nextCoordinates.lat.toFixed(5)}, ${nextCoordinates.lng.toFixed(5)}` }));
          }
        } catch (error) {
          setEditJobForm((prev) => ({ ...prev, location: `${nextCoordinates.lat.toFixed(5)}, ${nextCoordinates.lng.toFixed(5)}` }));
          console.error('Error reverse geocoding edit job location:', error);
        } finally {
          setEditJobLocationFeedback({ type: 'success', message: 'Current location shared for this job.' });
          setSavingEditJobLocation(false);
        }
      },
      () => {
        setEditJobLocationFeedback({ type: 'error', message: 'Unable to access your current location.' });
        setSavingEditJobLocation(false);
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 60000 }
    );
  };

  const handleDeleteJob = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job posting? This action cannot be undone.')) {
      return;
    }

    try {
      await axios.delete(`${API_URL}/api/jobs/${id}`);
      setJobs(jobs.filter(job => job._id !== id));
      alert('Job deleted successfully!');
    } catch (error) {
      console.error('Error deleting job:', error);
      alert(error.response?.data?.message || 'Error deleting job');
    }
  };

  const handleAcceptApplication = async (jobId, applicationId) => {
    try {
      await axios.put(`${API_URL}/api/jobs/${jobId}/applications/${applicationId}/accept`);
      await fetchJobs();
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

  const handleSyncCurrentLocation = () => {
    if (savingLocation) return;

    setSavingLocation(true);
    setLocationFeedback({ type: '', message: '' });

    if (!navigator.geolocation) {
      setLocationFeedback({ type: 'error', message: 'Geolocation is not supported by your browser.' });
      setSavingLocation(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const latitude = Number(position.coords.latitude);
          const longitude = Number(position.coords.longitude);

          const endpoint = user.role === 'worker' ? `${API_URL}/api/workers/location` : `${API_URL}/api/auth/location`;
          await axios.put(endpoint, {
            lat: latitude,
            lng: longitude
          });

          let resolvedAddress = '';
          try {
            const response = await axios.get('https://nominatim.openstreetmap.org/reverse', {
              params: {
                format: 'json',
                lat: latitude,
                lon: longitude
              }
            });
            resolvedAddress = response?.data?.display_name || '';
          } catch (reverseGeoError) {
            console.error('Error reverse geocoding profile location:', reverseGeoError);
          }

          const fallbackAddress = `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`;
          const nextLocationText = resolvedAddress || fallbackAddress;
          setFormData((prev) => ({ ...prev, location: nextLocationText }));
          setProfile((prev) => (
            prev
              ? { ...prev, user: { ...prev.user, location: nextLocationText } }
              : prev
          ));

          setLocationFeedback({ type: 'success', message: 'Current location saved for nearby matching.' });
        } catch (error) {
          console.error('Error updating worker location:', error);
          const apiData = error.response?.data;
          const message =
            (typeof apiData === 'string' && apiData) ||
            apiData?.message ||
            error.message ||
            'Failed to save location.';
          setLocationFeedback({ type: 'error', message: `Failed to save location: ${message}` });
        } finally {
          setSavingLocation(false);
        }
      },
      () => {
        setLocationFeedback({ type: 'error', message: 'Unable to access your current location.' });
        setSavingLocation(false);
      },
      { enableHighAccuracy: false, timeout: 7000, maximumAge: 60000 }
    );
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
      <div className="dashboard-container container">
        <div className="dashboard-header flex-between align-center mb-30 glass-panel" style={{ padding: '20px 25px' }}>
          <div>
            <h1 className="m-0 text-gradient text-xxl">Welcome, {profile.user.name.split(' ')[0]}</h1>
            <p className="text-muted m-0 mt-5">Ready to get things done?</p>
          </div>
        </div>

        <div className="dashboard-content dashboard-grid">
          
          {/* Left Column: Profile (Always Visible) */}
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

                {profileFeedback.message && (
                  <div
                    className="mb-15"
                    style={{
                      padding: '10px 12px',
                      borderRadius: '10px',
                      border: profileFeedback.type === 'success' ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(239,68,68,0.4)',
                      backgroundColor: profileFeedback.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                      color: profileFeedback.type === 'success' ? '#10B981' : '#EF4444',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      gap: '10px'
                    }}
                  >
                    <span>{profileFeedback.message}</span>
                    <button
                      type="button"
                      onClick={() => setProfileFeedback({ type: '', message: '' })}
                      style={{
                        border: 'none',
                        background: 'transparent',
                        color: 'inherit',
                        cursor: 'pointer',
                        fontSize: '18px',
                        lineHeight: 1,
                        padding: 0
                      }}
                      aria-label="Dismiss message"
                      title="Dismiss"
                    >
                      ×
                    </button>
                  </div>
                )}

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
                      <div className="flex-gap mt-10">
                        <button
                          type="button"
                          className="btn-secondary text-sm"
                          onClick={handleSyncCurrentLocation}
                          disabled={savingLocation}
                        >
                          {savingLocation ? 'Sharing location...' : 'Share Current Location'}
                        </button>
                      </div>
                      {locationFeedback.message && (
                        <p
                          className="mt-10"
                          style={{ color: locationFeedback.type === 'success' ? '#10B981' : '#EF4444' }}
                        >
                          {locationFeedback.message}
                        </p>
                      )}
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
                          <label>Hourly Rate (₹):</label>
                          <input type="number" name="hourlyRate" value={formData.hourlyRate || ''} onChange={handleInputChange} min="0" className="text-input" />
                        </div>

                        <div className="form-group">
                          <label>Description:</label>
                          <textarea name="description" value={formData.description || ''} onChange={handleInputChange} rows="4" className="text-input" />
                        </div>
                      </>
                    )}
                    <button type="submit" className="btn-primary mt-10" disabled={savingProfile}>
                      {savingProfile ? 'Saving...' : 'Save Changes'}
                    </button>
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
                          {(Array.isArray(profile.workerDetails.skills) ? profile.workerDetails.skills : []).map(s => <span key={s} className="skill-tag">{s}</span>)}
                        </div>
                        <p><strong>Experience:</strong> {profile.workerDetails.experience} years</p>
                        {profile.workerDetails.hourlyRate && <p><strong>Hourly Rate:</strong> <span className="text-green">₹{profile.workerDetails.hourlyRate}</span></p>}
                        {profile.workerDetails.description && <p><strong>Description:</strong> {profile.workerDetails.description}</p>}
                        <p className="mt-10"><strong>Rating:</strong> ⭐ {Number(profile.workerDetails.rating || 0).toFixed(1)}</p>
                        <p><strong>Jobs Completed:</strong> {profile.workerDetails.completedJobs}</p>
                        <button type="button" className="btn-secondary mt-10" onClick={handleSyncCurrentLocation} disabled={savingLocation}>
                          {savingLocation ? 'Saving location...' : 'Use Current Location for Nearby Search'}
                        </button>
                        {locationFeedback.message && (
                          <div
                            className="mt-10"
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: locationFeedback.type === 'success' ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(239,68,68,0.4)',
                              backgroundColor: locationFeedback.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                              color: locationFeedback.type === 'success' ? '#10B981' : '#EF4444'
                            }}
                          >
                            {locationFeedback.message}
                          </div>
                        )}
                      </>
                    )}
                    {user.role === 'customer' && (
                      <>
                        <button type="button" className="btn-secondary mt-10" onClick={handleSyncCurrentLocation} disabled={savingLocation}>
                          {savingLocation ? 'Saving location...' : 'Save Current Location'}
                        </button>
                        {locationFeedback.message && (
                          <div
                            className="mt-10"
                            style={{
                              padding: '8px 10px',
                              borderRadius: '8px',
                              border: locationFeedback.type === 'success' ? '1px solid rgba(16,185,129,0.4)' : '1px solid rgba(239,68,68,0.4)',
                              backgroundColor: locationFeedback.type === 'success' ? 'rgba(16,185,129,0.1)' : 'rgba(239,68,68,0.1)',
                              color: locationFeedback.type === 'success' ? '#10B981' : '#EF4444'
                            }}
                          >
                            {locationFeedback.message}
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
                
                {user.role === 'customer' && (
                  <NearbyWorkers />
                )}
              </motion.div>

          {/* Right Column: Tabs and Dynamic Content */}
          <div className="dashboard-right-column" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div className="dashboard-tabs glass-panel" style={{ marginBottom: 0 }}>
              
              {user.role === 'customer' && (
                <button 
                  className={`tab-btn ${activeTab === 'jobs' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('jobs')}
                >
                  My Postings
                </button>
              )}

              {user.role === 'worker' && (
                <button 
                  className={`tab-btn ${activeTab === 'applications' ? 'active' : ''}`} 
                  onClick={() => setActiveTab('applications')}
                >
                  My Applications
                </button>
              )}

              <button 
                className={`tab-btn ${activeTab === 'direct-requests' ? 'active' : ''}`} 
                onClick={() => setActiveTab('direct-requests')}
              >
                Direct Requests 
                {directRequests.length > 0 && <span className="tab-badge">{directRequests.length}</span>}
              </button>
              
            </div>

            {activeTab === 'direct-requests' && (
              <motion.div className="direct-requests-section glass-panel" layout>
              <div className="section-header">
                <h2>Direct Job Requests</h2>
              </div>
              <div className="list-gap mt-20" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '20px' }}>
                {Array.isArray(directRequests) ? directRequests.map(job => (
                  <JobJourneyCard 
                    key={job._id} 
                    job={job} 
                    onUpdate={() => axios.get(`${API_URL}/api/jobs/direct-requests`).then(res => setDirectRequests(res.data.jobs))} 
                    onOpenReview={() => handleOpenReviewModal(job)}
                  />
                )) : <p className="text-muted">No direct requests</p>}
              </div>
              </motion.div>
            )}

            {activeTab === 'jobs' && user.role === 'customer' && (
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
                    <input type="text" name="location" value={jobForm.location} onChange={handleJobFormChange} required placeholder="e.g., Pune,Mumbai" className="text-input" />
                    <div className="flex-gap mt-10">
                      <button type="button" className="btn-secondary text-sm" onClick={handleShareJobLocation} disabled={savingJobLocation}>
                        {savingJobLocation ? 'Sharing location...' : 'Share Current Location'}
                      </button>
                      {jobCoordinates && (
                        <span className="text-xs text-muted">
                          Shared: {jobCoordinates.lat.toFixed(4)}, {jobCoordinates.lng.toFixed(4)}
                        </span>
                      )}
                    </div>
                    {jobLocationFeedback.message && (
                      <p
                        className="mt-10"
                        style={{ color: jobLocationFeedback.type === 'success' ? '#10B981' : '#EF4444' }}
                      >
                        {jobLocationFeedback.message}
                      </p>
                    )}
                  </div>

                  <div className="form-group">
                    <label>Budget (₹):</label>
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
                {Array.isArray(jobs) ? jobs.map((job, idx) => (
                  <motion.div key={job._id} className="job-card-wrapper" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.1 }}>
                    {editingJobId === job._id ? (
                      <form onSubmit={handleUpdateJob} className="job-form glass-subpanel p-20 mb-20">
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
                          <div className="flex-gap mt-10">
                            <button type="button" className="btn-secondary text-sm" onClick={handleShareEditJobLocation} disabled={savingEditJobLocation}>
                              {savingEditJobLocation ? 'Sharing location...' : 'Share Current Location'}
                            </button>
                            {editJobCoordinates && (
                              <span className="text-xs text-muted">
                                Shared: {editJobCoordinates.lat.toFixed(4)}, {editJobCoordinates.lng.toFixed(4)}
                              </span>
                            )}
                          </div>
                          {editJobLocationFeedback.message && (
                            <p
                          className="mt-10"
                          style={{ color: editJobLocationFeedback.type === 'success' ? '#10B981' : '#EF4444' }}
                        >
                          {editJobLocationFeedback.message}
                        </p>
                          )}
                        </div>
                        <div className="form-group">
                          <label>Budget (₹):</label>
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
                    ) : job.status === 'open' ? (
                      <div className="glass-subpanel p-20 mb-20">
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
                        <p className="font-bold text-green mt-10">₹{job.budget}</p>
                        <p className="mt-10"><strong>Status:</strong> <span className={`status-badge ${job.status}`}>{job.status}</span></p>

                        {job.applications?.length > 0 && job.status === 'open' && (
                          <div className="applications glass-subpanel mt-20">
                            <h4>Applications ({job.applications.length})</h4>
                            <div className="list-gap mt-10">
                              {Array.isArray(job.applications) ? job.applications.map(app => (
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
                              )) : <p className="text-muted">No applications</p>}
                            </div>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="mb-20">
                        <JobJourneyCard job={job} onUpdate={fetchJobs} onOpenReview={() => handleOpenReviewModal(job)} />
                      </div>
                    )}
                  </motion.div>
                )) : <p className="text-muted">No jobs available</p>}
              </div>
              <div className="pagination">
                {/* Add pagination logic if required later */}
              </div>
              </motion.div>
            )}

            {activeTab === 'applications' && user.role === 'worker' && (
              <motion.div className="applications-section glass-panel" layout>
              <h2 className="section-header">My Applications</h2>
              <div className="applications-list list-gap mt-20">
                {Array.isArray(applications) ? applications.map((app, idx) => (
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
                )) : null}
                {(!Array.isArray(applications) || applications.length === 0) && <p className="text-muted italic">You haven't applied to any jobs yet.</p>}
              </div>
              </motion.div>
            )}
          </div>
        </div>
      </div>

      <ReviewModal
        isOpen={reviewModalOpen}
        onClose={() => setReviewModalOpen(false)}
        job={selectedJobForReview}
        onReviewSubmitted={() => {
          fetchJobs();
          fetchDirectRequests();
        }}
      />
    </motion.div>
  );
};

export default Dashboard;