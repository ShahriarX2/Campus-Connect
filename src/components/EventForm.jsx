import { useState, useEffect } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { Fragment } from 'react';
import { XMarkIcon, CalendarIcon, ClockIcon, MapPinIcon } from '@heroicons/react/24/outline';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';
import PropTypes from 'prop-types';

const EventForm = ({ isOpen, onClose, onSubmit, editingEvent = null }) => {
  const { profile } = useAuth();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    location: '',
    event_date: '',
    event_time: ''
  });
  const [errors, setErrors] = useState({});

  // Initialize form data when editing
  useEffect(() => {
    if (editingEvent) {
      setFormData({
        title: editingEvent.title || '',
        description: editingEvent.description || '',
        location: editingEvent.location || '',
        event_date: editingEvent.event_date || '',
        event_time: editingEvent.event_time || ''
      });
    } else {
      // Reset form for new event
      setFormData({
        title: '',
        description: '',
        location: '',
        event_date: '',
        event_time: ''
      });
    }
    setErrors({});
  }, [editingEvent, isOpen]);

  // Get minimum date (today)
  const getMinDate = () => {
    const today = new Date();
    return today.toISOString().split('T')[0];
  };

  // Validate form data
  const validateForm = () => {
    const newErrors = {};

    // Title validation
    if (!formData.title.trim()) {
      newErrors.title = 'Title is required';
    } else if (formData.title.trim().length < 3) {
      newErrors.title = 'Title must be at least 3 characters';
    } else if (formData.title.length > 255) {
      newErrors.title = 'Title must not exceed 255 characters';
    }

    // Description validation
    if (!formData.description.trim()) {
      newErrors.description = 'Description is required';
    } else if (formData.description.trim().length < 10) {
      newErrors.description = 'Description must be at least 10 characters';
    }

    // Location validation
    if (!formData.location.trim()) {
      newErrors.location = 'Location is required';
    } else if (formData.location.length > 500) {
      newErrors.location = 'Location must not exceed 500 characters';
    }

    // Date validation
    if (!formData.event_date) {
      newErrors.event_date = 'Event date is required';
    } else {
      const selectedDate = new Date(formData.event_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.event_date = 'Event date cannot be in the past';
      }
    }

    // Time validation
    if (!formData.event_time) {
      newErrors.event_time = 'Event time is required';
    } else {
      // Additional validation for today's events
      if (formData.event_date === getMinDate()) {
        const now = new Date();
        const [hours, minutes] = formData.event_time.split(':');
        const eventDateTime = new Date();
        eventDateTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);
        
        if (eventDateTime <= now) {
          newErrors.event_time = 'Event time must be in the future for today\'s events';
        }
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    
    // Clear error for this field when user starts typing
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }));
    }
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const eventData = {
        ...formData,
        title: formData.title.trim(),
        description: formData.description.trim(),
        location: formData.location.trim(),
        created_by: profile.id
      };

      await onSubmit(eventData, editingEvent?.id);

      toast.success(editingEvent ? 'Event updated successfully!' : 'Event created successfully!');
      onClose();
    } catch (error) {
      console.error('Error saving event:', error);
      toast.error(error.message || 'Failed to save event. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Format date for display
  const formatEventDate = () => {
    if (!formData.event_date) return '';
    const date = new Date(formData.event_date);
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  // Format time for display
  const formatEventTime = () => {
    if (!formData.event_time) return '';
    const [hours, minutes] = formData.event_time.split(':');
    const date = new Date();
    date.setHours(parseInt(hours), parseInt(minutes));
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <Transition appear show={isOpen} as={Fragment}>
      <Dialog as="div" className="relative z-50" onClose={onClose}>
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-300"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-200"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/25 dark:bg-black/50" />
        </Transition.Child>

        <div className="fixed inset-0 overflow-y-auto">
          <div className="flex min-h-full items-center justify-center p-4 text-center">
            <Transition.Child
              as={Fragment}
              enter="ease-out duration-300"
              enterFrom="opacity-0 scale-95"
              enterTo="opacity-100 scale-100"
              leave="ease-in duration-200"
              leaveFrom="opacity-100 scale-100"
              leaveTo="opacity-0 scale-95"
            >
              <Dialog.Panel className="w-full max-w-2xl transform overflow-hidden rounded-2xl bg-white dark:bg-gray-800 text-left align-middle shadow-xl transition-all">
                {/* Header */}
                <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center space-x-3">
                    <CalendarIcon className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                    <h3 className="text-lg font-medium text-gray-900 dark:text-white">
                      {editingEvent ? 'Edit Event' : 'Create New Event'}
                    </h3>
                  </div>
                  <button
                    type="button"
                    className="text-gray-400 hover:text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors duration-200"
                    onClick={onClose}
                  >
                    <XMarkIcon className="h-5 w-5" />
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6">
                  <div className="space-y-6">
                    {/* Event Title */}
                    <div>
                      <label htmlFor="title" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Event Title *
                      </label>
                      <input
                        type="text"
                        id="title"
                        name="title"
                        value={formData.title}
                        onChange={handleChange}
                        placeholder="Enter event title"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                          errors.title ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.title && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.title}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label htmlFor="description" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Description *
                      </label>
                      <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        rows={4}
                        placeholder="Describe the event details, agenda, and any important information"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 resize-none dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                          errors.description ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                      )}
                    </div>

                    {/* Location */}
                    <div>
                      <label htmlFor="location" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        <MapPinIcon className="h-4 w-4 inline mr-1" />
                        Location *
                      </label>
                      <input
                        type="text"
                        id="location"
                        name="location"
                        value={formData.location}
                        onChange={handleChange}
                        placeholder="Event venue or location"
                        className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400 ${
                          errors.location ? 'border-red-500' : 'border-gray-300'
                        }`}
                      />
                      {errors.location && (
                        <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.location}</p>
                      )}
                    </div>

                    {/* Date and Time */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Event Date */}
                      <div>
                        <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <CalendarIcon className="h-4 w-4 inline mr-1" />
                          Date *
                        </label>
                        <input
                          type="date"
                          id="event_date"
                          name="event_date"
                          value={formData.event_date}
                          onChange={handleChange}
                          min={getMinDate()}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                            errors.event_date ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.event_date && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.event_date}</p>
                        )}
                      </div>

                      {/* Event Time */}
                      <div>
                        <label htmlFor="event_time" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          <ClockIcon className="h-4 w-4 inline mr-1" />
                          Time *
                        </label>
                        <input
                          type="time"
                          id="event_time"
                          name="event_time"
                          value={formData.event_time}
                          onChange={handleChange}
                          className={`w-full px-4 py-3 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors duration-200 dark:bg-gray-700 dark:border-gray-600 dark:text-white ${
                            errors.event_time ? 'border-red-500' : 'border-gray-300'
                          }`}
                        />
                        {errors.event_time && (
                          <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.event_time}</p>
                        )}
                      </div>
                    </div>

                    {/* Event Preview */}
                    {(formData.event_date || formData.event_time) && (
                      <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <h4 className="text-sm font-medium text-blue-900 dark:text-blue-200 mb-2">
                          Event Preview
                        </h4>
                        <div className="text-sm text-blue-800 dark:text-blue-300">
                          {formData.event_date && (
                            <p><strong>Date:</strong> {formatEventDate()}</p>
                          )}
                          {formData.event_time && (
                            <p><strong>Time:</strong> {formatEventTime()}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end space-x-3 mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors duration-200"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed rounded-lg transition-colors duration-200"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent mr-2"></div>
                          {editingEvent ? 'Updating...' : 'Creating...'}
                        </span>
                      ) : (
                        editingEvent ? 'Update Event' : 'Create Event'
                      )}
                    </button>
                  </div>
                </form>
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </div>
      </Dialog>
    </Transition>
  );
};

EventForm.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  editingEvent: PropTypes.shape({
    id: PropTypes.string,
    title: PropTypes.string,
    description: PropTypes.string,
    location: PropTypes.string,
    event_date: PropTypes.string,
    event_time: PropTypes.string,
  }),
};

export default EventForm;
