async function testFullFlow() {
  try {
    // 1. Login as John
    const jLogin = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({email: 'john@example.com', password: 'password123'})
    });
    const johnToken = (await jLogin.json()).token;

    // 2. Login as Alex
    const aLogin = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({email: 'alex@example.com', password: 'password123'})
    });
    const alexToken = (await aLogin.json()).token;

    // 3. John creates a job
    const jobRes = await fetch('http://localhost:5000/api/jobs', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + johnToken },
      body: JSON.stringify({
        title: 'Fix my broken door',
        description: 'The door hinge is broken.',
        requiredSkills: ['carpentry'],
        location: 'New York, NY',
        budget: 150
      })
    });
    const jobData = await jobRes.json();
    if (!jobRes.ok) throw new Error('Job creation failed: ' + JSON.stringify(jobData));
    const jobId = jobData.job._id;
    console.log('Job created:', jobId);

    // 4. Alex applies
    const applyRes = await fetch(`http://localhost:5000/api/jobs/${jobId}/apply`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': 'Bearer ' + alexToken },
      body: JSON.stringify({ message: 'I can fix it in 20 minutes!' })
    });
    const applyData = await applyRes.json();
    if (!applyRes.ok) throw new Error('Application failed: ' + JSON.stringify(applyData));
    console.log('Alex applied Successfully');

    // Fetch jobs to get the applicationId
    const jobsRes = await fetch('http://localhost:5000/api/jobs', {headers: {Authorization: 'Bearer ' + johnToken}});
    const jobsList = await jobsRes.json();
    const targetJob = jobsList.jobs.find(j => j._id === jobId);
    const appId = targetJob.applications[0]._id;
    console.log('Found application ID:', appId);

    // 5. John accepts
    const acceptRes = await fetch(`http://localhost:5000/api/jobs/${jobId}/applications/${appId}/accept`, {
      method: 'PUT', headers: { 'Authorization': 'Bearer ' + johnToken }
    });
    const acceptData = await acceptRes.json();
    if (!acceptRes.ok) {
        console.error('Accept Failed:', acceptData);
    } else {
        console.log('ACCEPT SUCCESS!', acceptData);
    }

  } catch (err) {
    console.error('TEST ERROR:', err.message);
  }
}
testFullFlow();
