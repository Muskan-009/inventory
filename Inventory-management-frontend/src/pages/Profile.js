import React, { useState, useEffect } from 'react';
import { 
  User, Mail, Lock, Save, Eye, EyeOff, Camera, Upload, X, 
  Edit, Globe, MapPin, Briefcase, Award, Tag, Play, Download, 
  MoreVertical, CheckCircle, Youtube, Instagram, Music, 
  Trophy, Star, Calendar, Phone, Building
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import toast from 'react-hot-toast';

const Profile = () => {
  const { user, updateUser } = useAuth();
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [profileImage, setProfileImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    current_password: '',
    new_password: '',
    confirm_password: '',
    // Extended profile fields
    role: '',
    experience_level: '',
    favorite_artists: '',
    favorite_genre: '',
    software_used: '',
    music_mood: '',
    city: '',
    availability: 'available',
    bio: '',
    phone: '',
    company: ''
  });

  // Sample data for demonstration
  const [profileData, setProfileData] = useState({
    role: 'Inventory Manager',
    experience_level: 'Expert',
    favorite_artists: 'System Admin, Database Expert, API Developer',
    favorite_genre: 'Business Management',
    software_used: 'React, Node.js, PostgreSQL',
    music_mood: 'Professional',
    city: 'Mumbai, India',
    availability: 'available',
    bio: 'Experienced inventory management professional with expertise in modern web technologies and business operations.',
    phone: '+91 98765 43210',
    company: 'Inventory Solutions Pvt Ltd'
  });

  const [badges] = useState([
    { name: 'Top Contributor', icon: Trophy, color: 'text-yellow-600' },
    { name: 'System Admin', icon: Star, color: 'text-blue-600' },
    { name: 'Expert User', icon: Award, color: 'text-green-600' }
  ]);

  const [tags] = useState(['#2024', '#Admin', '#Inventory', '#India', '#Expert']);

  const [productions] = useState([
    {
      id: 1,
      title: 'Inventory Dashboard',
      creator: user?.name || 'Admin',
      duration: '2:30',
      warnings: '0',
      status: 'completed',
      icon: 'purple'
    },
    {
      id: 2,
      title: 'Sales Report Generator',
      creator: user?.name || 'Admin',
      duration: '1:45',
      warnings: '2',
      status: 'completed',
      icon: 'purple'
    },
    {
      id: 3,
      title: 'Stock Management System',
      creator: user?.name || 'Admin',
      duration: '3:15',
      warnings: '1',
      status: 'in_progress',
      icon: 'gray'
    }
  ]);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || '',
        email: user.email || '',
        current_password: '',
        new_password: '',
        confirm_password: '',
        role: profileData.role,
        experience_level: profileData.experience_level,
        favorite_artists: profileData.favorite_artists,
        favorite_genre: profileData.favorite_genre,
        software_used: profileData.software_used,
        music_mood: profileData.music_mood,
        city: profileData.city,
        availability: profileData.availability,
        bio: profileData.bio,
        phone: profileData.phone,
        company: profileData.company
      });
    }
  }, [user, profileData]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error('Image size should be less than 5MB');
        return;
      }
      
      if (!file.type.startsWith('image/')) {
        toast.error('Please select a valid image file');
        return;
      }

      setProfileImage(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setImagePreview(e.target.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = () => {
    setProfileImage(null);
    setImagePreview(null);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      // Update profile information
      if (formData.name !== user.name || formData.email !== user.email) {
        const response = await api.put('/auth/profile', {
          name: formData.name,
          email: formData.email
        });
        
        if (response.data.success) {
          updateUser(response.data.data.user);
          toast.success('Profile updated successfully');
          setProfileImage(null);
          setImagePreview(null);
        }
      }

      // Update extended profile data
      setProfileData({
        role: formData.role,
        experience_level: formData.experience_level,
        favorite_artists: formData.favorite_artists,
        favorite_genre: formData.favorite_genre,
        software_used: formData.software_used,
        music_mood: formData.music_mood,
        city: formData.city,
        availability: formData.availability,
        bio: formData.bio,
        phone: formData.phone,
        company: formData.company
      });

      // Update password if provided
      if (formData.new_password) {
        if (formData.new_password !== formData.confirm_password) {
          toast.error('New passwords do not match');
          return;
        }

        const response = await api.put('/auth/change-password', {
          current_password: formData.current_password,
          new_password: formData.new_password
        });

        if (response.data.success) {
          toast.success('Password changed successfully');
          setFormData({
            ...formData,
            current_password: '',
            new_password: '',
            confirm_password: ''
          });
        }
      }

      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error(error.response?.data?.message || 'Failed to update profile');
    } finally {
      setLoading(false);
    }
  };

  const getIconColor = (icon) => {
    switch (icon) {
      case 'purple': return 'text-purple-500';
      case 'gray': return 'text-gray-400';
      default: return 'text-blue-500';
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-3xl font-bold text-gray-900">Profile</h1>
        <p className="text-gray-600 mt-1">Here an todo profile photo here.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="card p-6 text-center">
            <div className="relative inline-block mb-4">
              <div className="w-32 h-32 rounded-full overflow-hidden bg-gradient-to-br from-primary-100 to-blue-100 flex items-center justify-center mx-auto">
                {imagePreview ? (
                  <img 
                    src={imagePreview} 
                    alt="Profile Preview" 
                    className="w-full h-full object-cover"
                  />
                ) : user?.profile_image ? (
                  <img 
                    src={user.profile_image} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <User className="h-16 w-16 text-primary-400" />
                )}
              </div>
              
              {isEditing && (
                <label className="absolute -bottom-2 -right-2 bg-primary-600 text-white rounded-full p-2 hover:bg-primary-700 transition-colors cursor-pointer">
                  <Camera className="h-4 w-4" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            
            <h2 className="text-xl font-bold text-gray-900 mb-1">{user?.name || 'Admin User'}</h2>
            <p className="text-gray-600 mb-4">{profileData.role} | {user?.role?.replace('_', ' ')}</p>
            
            {!isEditing && (
              <button
                onClick={() => setIsEditing(true)}
                className="btn btn-primary btn-sm flex items-center gap-2 mx-auto"
              >
                <Edit className="h-4 w-4" />
                Edit Profile
              </button>
            )}
          </div>

          {/* Social Media */}
          <div className="card p-6">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Social Media</h3>
            <div className="flex justify-center space-x-4">
              <a href="#" className="p-3 bg-red-100 text-red-600 rounded-full hover:bg-red-200 transition-colors">
                <Youtube className="h-6 w-6" />
              </a>
              <a href="#" className="p-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full hover:opacity-80 transition-opacity">
                <Instagram className="h-6 w-6" />
              </a>
              <a href="#" className="p-3 bg-gray-800 text-white rounded-full hover:bg-gray-700 transition-colors">
                <Music className="h-6 w-6" />
              </a>
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="lg:col-span-2 space-y-6">
          {/* Bio & Other Details */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-medium text-gray-900">Bio & other details</h3>
              <div className="w-3 h-3 bg-green-500 rounded-full"></div>
            </div>
            
            {isEditing ? (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">My Role</label>
                    <input
                      type="text"
                      name="role"
                      value={formData.role}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Experience Level</label>
                    <select
                      name="experience_level"
                      value={formData.experience_level}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="Beginner">Beginner</option>
                      <option value="Intermediate">Intermediate</option>
                      <option value="Advanced">Advanced</option>
                      <option value="Expert">Expert</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Favorite Technologies</label>
                    <input
                      type="text"
                      name="favorite_artists"
                      value={formData.favorite_artists}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Industry</label>
                    <input
                      type="text"
                      name="favorite_genre"
                      value={formData.favorite_genre}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Software/Technologies</label>
                    <input
                      type="text"
                      name="software_used"
                      value={formData.software_used}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Work Style</label>
                    <input
                      type="text"
                      name="music_mood"
                      value={formData.music_mood}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">City/Region</label>
                    <input
                      type="text"
                      name="city"
                      value={formData.city}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Availability</label>
                    <select
                      name="availability"
                      value={formData.availability}
                      onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                    >
                      <option value="available">Available for Collaboration</option>
                      <option value="busy">Busy</option>
                      <option value="unavailable">Unavailable</option>
                    </select>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bio</label>
                  <textarea
                    name="bio"
                    value={formData.bio}
                    onChange={handleChange}
                    rows={3}
                    className="w-full border border-gray-300 rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => setIsEditing(false)}
                    className="btn btn-secondary btn-md"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="btn btn-primary btn-md flex items-center gap-2"
                  >
                    <Save className="h-4 w-4" />
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex justify-between">
                    <span className="text-gray-600">My Role:</span>
                    <span className="font-medium">{profileData.role}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Experience Level:</span>
                    <span className="font-medium">{profileData.experience_level}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Favorite Technologies:</span>
                    <span className="font-medium">{profileData.favorite_artists}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Industry:</span>
                    <span className="font-medium">{profileData.favorite_genre}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Software/Technologies:</span>
                    <span className="font-medium">{profileData.software_used}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Work Style:</span>
                    <span className="font-medium">{profileData.music_mood}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">City/Region:</span>
                    <span className="font-medium">{profileData.city}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">Availability:</span>
                    <span className="flex items-center gap-2 font-medium text-green-600">
                      <CheckCircle className="h-4 w-4" />
                      Available for Collaboration
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Badges and Tags */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Badges */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Badges</h3>
              <div className="space-y-3">
                {badges.map((badge, index) => {
                  const IconComponent = badge.icon;
                  return (
                    <div key={index} className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
                      <IconComponent className={`h-5 w-5 ${badge.color}`} />
                      <span className="font-medium">{badge.name}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Tags */}
            <div className="card p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">Tags</h3>
              <div className="flex flex-wrap gap-2">
                {tags.map((tag, index) => (
                  <span key={index} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* My Productions/Projects */}
      <div className="card p-6">
        <h3 className="text-lg font-medium text-gray-900 mb-6">My Projects</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Title</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Creator</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {productions.map((production) => (
                <tr key={production.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${getIconColor(production.icon)}`}></div>
                      <span className="text-sm font-medium text-gray-900">{production.title}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {production.creator}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {production.duration}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      production.status === 'completed' 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {production.status === 'completed' ? 'Completed' : 'In Progress'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-900">
                        <Play className="h-4 w-4" />
                      </button>
                      <button className="text-green-600 hover:text-green-900">
                        <Download className="h-4 w-4" />
                      </button>
                      <button className="text-gray-600 hover:text-gray-900">
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Profile;
