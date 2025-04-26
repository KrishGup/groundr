import React, { useState, useContext, useEffect } from 'react';
import { UserContext } from '../context/UserContext';

const Profile = () => {
  const { userProfile, updateUserProfile, userId } = useContext(UserContext);
  const [formData, setFormData] = useState({
    name: '',
    age: '',
    contact: '',
    image: null,
    height: '',
    weight: '',
    training: '',
    bio: ''
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
        image: userProfile.image || null,
        height: userProfile.height || '',
        weight: userProfile.weight || '',
        training: userProfile.training || '',
        bio: userProfile.bio || ''
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
    
    // Validate form - required fields
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
      <p>Complete your profile to start finding boxing opponents</p>
      
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
        <h3>Required Information</h3>
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
        
        <h3>Fighter Details (Optional)</h3>
        <div className="form-group">
          <label htmlFor="height">Height</label>
          <input
            type="text"
            id="height"
            name="height"
            value={formData.height}
            onChange={handleChange}
            placeholder="e.g., 5'10'' or 178cm"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="weight">Weight</label>
          <input
            type="text"
            id="weight"
            name="weight"
            value={formData.weight}
            onChange={handleChange}
            placeholder="e.g., 160 lbs or 73 kg"
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="training">Training Experience</label>
          <select
            id="training"
            name="training"
            value={formData.training}
            onChange={handleChange}
          >
            <option value="">Select experience level</option>
            <option value="Beginner">Beginner (0-1 years)</option>
            <option value="Intermediate">Intermediate (1-3 years)</option>
            <option value="Advanced">Advanced (3-5 years)</option>
            <option value="Professional">Professional (5+ years)</option>
          </select>
        </div>
        
        <div className="form-group">
          <label htmlFor="bio">About Me</label>
          <textarea
            id="bio"
            name="bio"
            value={formData.bio}
            onChange={handleChange}
            placeholder="Tell potential opponents about yourself, your fighting style, goals, etc."
            rows="4"
          ></textarea>
        </div>
        
        <button 
          type="submit" 
          className="submit-btn" 
          disabled={isLoading}
        >
          {isLoading ? 'Saving...' : (userProfile ? 'Update Profile' : 'Create Profile')}
        </button>
      </form>
    </div>
  );
};

export default Profile;