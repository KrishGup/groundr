import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../context/UserContext';

const Profile = () => {
  const { userProfile, updateUserProfile, userId } = useContext(UserContext);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    contact: '',
    image: null
  });
  const [previewImage, setPreviewImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState(null);

  // Reset form when user profile changes
  useEffect(() => {
    if (userProfile) {
      setFormData({
        name: userProfile.name || '',
        age: userProfile.age || '',
        contact: userProfile.contact || '',
        image: userProfile.image || null
      });
      setPreviewImage(userProfile.image || null);
    }
  }, [userProfile]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setMessage({type: 'error', text: 'Image must be smaller than 5MB'});
      return;
    }

    // Store the actual file object for Firebase upload
    setFormData({
      ...formData,
      image: file
    });

    // Create local preview
    const reader = new FileReader();
    reader.onload = (e) => {
      const imageUrl = e.target.result;
      setPreviewImage(imageUrl);
    };
    reader.onerror = () => {
      setMessage({type: 'error', text: 'Error reading file'});
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage(null);
    
    // Validate form
    if (!formData.name.trim()) {
      setMessage({type: 'error', text: 'Please enter your name'});
      return;
    }
    
    if (!formData.age) {
      setMessage({type: 'error', text: 'Please enter your age'});
      return;
    }
    
    if (!formData.contact.trim()) {
      setMessage({type: 'error', text: 'Please enter contact information'});
      return;
    }
    
    // Check if either we have a file upload or an existing image URL
    if (!formData.image) {
      setMessage({type: 'error', text: 'Please upload a profile photo'});
      return;
    }

    setIsLoading(true);
    try {
      console.log('Saving profile with data:', {
        ...formData,
        image: formData.image instanceof File ? 'File object' : 'URL string'
      });
      
      await updateUserProfile(formData);
      setMessage({type: 'success', text: 'Profile updated successfully!'});
    } catch (error) {
      console.error("Error saving profile:", error);
      setMessage({type: 'error', text: 'Failed to update profile: ' + error.message});
    } finally {
      setIsLoading(false);
    }
  };

  if (!userId) {
    return (
      <div className="profile-section">
        <h2>Please Log In First</h2>
        <p>You need to create an account or log in before setting up your fighter profile</p>
      </div>
    );
  }

  return (
    <div className="profile-section">
      <h2>Your Fighter Profile</h2>
      <p>Upload your photo and information to start finding fights</p>
      
      {message && (
        <div className={`message ${message.type}`}>
          {message.text}
        </div>
      )}
      
      <div className="user-profile-container">
        {previewImage ? (
          <div className="user-profile">
            <img src={previewImage} alt="Your profile" />
          </div>
        ) : (
          <div className="user-profile empty-profile">
            <span>No Photo</span>
          </div>
        )}
      </div>
      
      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="photo-upload">Fighter Photo</label>
          <input 
            type="file" 
            id="photo-upload" 
            accept="image/*"
            onChange={handleImageChange}
          />
          <small>Max size: 5MB</small>
        </div>
        
        <div className="form-group">
          <label htmlFor="name">Name</label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="Enter your name"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="age">Age</label>
          <input
            type="number"
            id="age"
            name="age"
            value={formData.age}
            onChange={handleChange}
            placeholder="Enter your age"
            min="18"
            max="99"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="contact">Contact Information</label>
          <input
            type="text"
            id="contact"
            name="contact"
            value={formData.contact}
            onChange={handleChange}
            placeholder="Phone or email for fight arrangements"
          />
        </div>
        
        <button 
          type="submit" 
          className="submit-btn" 
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : (userProfile ? 'Update Profile' : 'Create Profile')}
        </button>
      </form>
      
      {/* Debug info */}
      <div style={{marginTop: '30px', padding: '10px', backgroundColor: '#f5f5f5', borderRadius: '5px', fontSize: '14px', textAlign: 'left'}}>
        <h4>Profile Debug Info</h4>
        <p>User ID: {userId || 'Not logged in'}</p>
        <p>Existing Profile: {userProfile ? 'Yes' : 'No'}</p>
        <p>Has Image: {formData.image ? 'Yes' : 'No'}</p>
      </div>
    </div>
  );
};

export default Profile;