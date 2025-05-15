// src/dashboards/BuyerDashboard.jsx
import React, { useState, useEffect } from 'react';
import './BuyerDashboard.css';
import { useTenders } from '../useTenders';

const BuyerDashboard = () => {  const { tenders, createTender, refreshTenders } = useTenders();
  const [form, setForm] = useState({
    title: '',
    description: '',
    issue_date: '',
    deadline: ''
  });
  const [submitSuccess, setSubmitSuccess] = useState(false);
  const [submitError, setSubmitError] = useState(null);
  
  // Refresh tenders when component mounts
  useEffect(() => {
    refreshTenders();
  }, [refreshTenders]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };  const createTenderHandler = async (e) => {
    e.preventDefault();
    setSubmitError(null);
    
    try {
      const newTender = {
        title: form.title,
        description: form.description,
        issue_date: form.issue_date,
        deadline: form.deadline,
        status: 'Pending Approval'  // Changed from 'Draft' to 'Pending Approval'
      };
      
      await createTender(newTender);
      setForm({ title: '', description: '', issue_date: '', deadline: '' });
      setSubmitSuccess(true);
      
      // Refresh the tenders list
      refreshTenders();
      
      // Hide success message after 5 seconds
      setTimeout(() => {
        setSubmitSuccess(false);
      }, 5000);
    } catch (error) {
      setSubmitError(error.message || 'Failed to create tender. Please try again.');
    }
  };
  return (
    <div className="buyer-dashboard">
      <h1>Buyer Dashboard</h1>
      
      {submitSuccess && (
        <div className="success-message">
          Your tender has been successfully created and sent for admin approval!
        </div>
      )}
      
      {submitError && (
        <div className="error-message">
          {submitError}
        </div>
      )}
      
      <form onSubmit={createTenderHandler}>
        <label>Issue Date:
          <input
            placeholder='Enter Issue Date'
            type="date"
            name="issue_date"
            value={form.issue_date}
            onChange={handleChange}
            required
          />
        </label>
        
        <input
          type="text"
          name="title"
          placeholder="Project Name"
          value={form.title}
          onChange={handleChange}
          required
        />
              
        <textarea
          name="description"
          placeholder="Description"
          value={form.description}
          onChange={handleChange}
          required
        />
              
        <label>Deadline:
          <input
            placeholder='Enter Deadline'
            type="date"
            name="deadline"  
            value={form.deadline}  
            onChange={handleChange}
            required
          />
        </label>

        <button type="submit">Create Tender</button>
      </form>
        <h2>Created Tenders:</h2>
      {tenders.length === 0 ? (
        <p>You haven't created any tenders yet.</p>
      ) : (
        <>
          <div className="status-info">
            <p><strong>Status Guide:</strong></p>
            <ul className="status-guide">
              <li><span className="status-badge pending-approval">Pending Approval</span> - Awaiting admin review</li>
              <li><span className="status-badge published">Published</span> - Approved and visible to bidders</li>
              <li><span className="status-badge rejected">Rejected</span> - Not approved by admin</li>
              <li><span className="status-badge archived">Archived</span> - Past deadline or canceled</li>
            </ul>
          </div>
          <ul className="tenders-list">
            {tenders.map((tender) => (
              <li key={tender.tender_id} className="tender-item">
                <div>
                  <strong>{tender.title}</strong> ({new Date(tender.issue_date).toLocaleDateString()})<br />
                  {tender.description}<br />
                  <strong>Deadline:</strong> {new Date(tender.deadline).toLocaleDateString()}
                </div>
                <div className="tender-status">
                  <span className={`status-badge ${tender.status?.toLowerCase().replace(/\s/g, '-')}`}>
                    {tender.status}
                  </span>
                  {tender.status === 'Pending Approval' && (
                    <p className="status-note">Your tender is waiting for admin approval</p>
                  )}
                  {tender.status === 'Rejected' && (
                    <p className="status-note">Your tender was not approved. Please create a new one with improvements.</p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
};

export default BuyerDashboard;