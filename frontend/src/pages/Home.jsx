import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api';
import { motion, useScroll, useTransform } from 'framer-motion';
import WorkerCard from '../components/WorkerCard';
import './Home.css';

const Home = () => {
  const [topWorkers, setTopWorkers] = useState([]);
  const [loading, setLoading] = useState(true);
  const { scrollY } = useScroll();
  const y1 = useTransform(scrollY, [0, 1000], [0, 200]);
  const opacity1 = useTransform(scrollY, [0, 400], [1, 0]);

  useEffect(() => {
    const fetchTopWorkers = async () => {
      try {
        const response = await api.get('/workers/top?limit=20');
        console.log('API Response (top workers):', response.data);
        setTopWorkers(Array.isArray(response.data) ? response.data : []);
      } catch (error) {
        console.error('Error fetching top workers:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTopWorkers();
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { 
      opacity: 1,
      transition: { staggerChildren: 0.1 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="home">
      <motion.section 
        className="hero"
        style={{ y: y1, opacity: opacity1 }}
      >
        <div className="hero-background-glow"></div>
        <div className="container relative-z">
          <motion.h1 
            initial={{ opacity: 0, y: -30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.1 }}
          >
            Find Trusted <span className="text-gradient">Local Workers</span>
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            Connect with skilled professionals for all your home service needs
          </motion.p>
          <motion.div 
            className="hero-actions"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.5 }}
          >
            <div className="hero-btn-group">
              <Link to="/workers" className="btn-primary hero-btn">Explore Map</Link>
              <Link to="/register" className="btn-secondary hero-btn">Join as Worker</Link>
            </div>
          </motion.div>
        </div>
      </motion.section>

      <section className="how-it-works">
        <div className="container">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="section-title"
          >
            How It Works
          </motion.h2>
          <motion.div 
            className="steps"
            variants={containerVariants}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
          >
            <motion.div className="step glass-panel" variants={itemVariants}>
              <div className="step-icon">📝</div>
              <h3>1. Post Your Job</h3>
              <p>Describe what you need and set your budget on our interactive map.</p>
            </motion.div>
            <motion.div className="step glass-panel" variants={itemVariants}>
              <div className="step-icon">⚡</div>
              <h3>2. Instant Matches</h3>
              <p>Nearby pros get instant push notifications and send you proposals.</p>
            </motion.div>
            <motion.div className="step glass-panel" variants={itemVariants}>
              <div className="step-icon">🤝</div>
              <h3>3. Hire & Review</h3>
              <p>Choose the best worker, complete the job, and leave a detailed rating.</p>
            </motion.div>
          </motion.div>
        </div>
      </section>

      <section className="featured-workers">
        <div className="container">
          <motion.h2 
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            className="section-title"
          >
            Top Rated Professionals
          </motion.h2>
          
          {loading ? (
            <div className="workers-grid">
              {[1,2,3,4,5,6].map(i => (
                <div key={i} className="glass-panel workers-skeleton"></div>
              ))}
            </div>
          ) : (
            <motion.div 
              className="workers-grid"
              variants={containerVariants}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
            >
              {Array.isArray(topWorkers) ? topWorkers.map((worker, index) => (
                <WorkerCard key={worker._id} worker={worker} index={index} />
              )) : <p className="text-muted" style={{ gridColumn: '1 / -1', textAlign: 'center' }}>No top workers found.</p>}
            </motion.div>
          )}
          
          <motion.div 
            className="view-all"
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
          >
            <Link to="/workers" className="btn-secondary view-all-btn">
              View All Professionals
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};

export default Home;