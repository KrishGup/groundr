import React, { useState, useContext } from 'react';
import { UserContext } from '../context/UserContext';

const Profile = () => {
  const { userProfile, updateUserProfile } = useContext(UserContext);
  const [formData, setFormData] = useState({
    name: userProfile?.name || '',
    age: userProfile?.age || '',
    contact: userProfile?.contact || '',
    image: userProfile?.image || null
  });
  const [previewImage, setPreviewImage] = useState(userProfile?.image || null);
  const [isLoading, setIsLoading] = useState(false);

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
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.image) {
      alert('Please upload a photo');
      return;
    }
    if (!formData.name || !formData.age || !formData.contact) {
      alert('Please fill in all fields');
      return;
    }

    setIsLoading(true);
    try {
      await updateUserProfile(formData);
      alert('Profile updated successfully!');
    } catch (error) {
      console.error("Error saving profile:", error);
      alert('Failed to update profile. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="profile-section">
      <h2>Your Fighter Profile</h2>
      <p>Upload your photo and information to start finding fights</p>
      
      {previewImage && (
        <div className="user-profile">
          <img src={previewImage} alt="Your profile" />
        </div>
      )}
      
      <form className="profile-form" onSubmit={handleSubmit}>
        <div className="form-group">
          <label htmlFor="photo-upload">Fighter Photo</label>
          <input 
            type="file" 
            id="photo-upload" 
            accept="image/*" 
            onChange={handleImageChange}
          />
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
          {isLoading ? 'Saving...' : 'Save Profile'}
        </button>
      </form>
    </div>
  );
};

export default Profile;