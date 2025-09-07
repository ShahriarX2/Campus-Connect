# Campus Forum Components

This directory contains the complete forum system for the Campus Connect application.

## Components

### 1. **Forum.jsx** - Main Forum Page
The main forum component that integrates all other components and provides:
- Real-time post updates
- Search and filtering
- Post creation interface
- Navigation to post details

### 2. **PostForm.jsx** - Post Creation Form
A form component for creating new forum posts with:
- Form validation
- Success/error feedback
- Real-time character counting
- Immediate post display after creation

### 3. **PostItem.jsx** - Individual Post Display
Displays individual posts with:
- Upvoting functionality
- Author information and role badges
- Content preview with "read more"
- Click navigation to post details

### 4. **PostDetail.jsx** - Detailed Post View
Full post view with comments section:
- Complete post content
- Real-time comments loading
- Comment creation form
- Navigation back to forum

### 5. **CommentItem.jsx** - Comment Display
Individual comment display component with:
- Author information
- Timestamps
- Role-based styling

## Features

### ✅ Immediate Post Display
Posts are displayed immediately after being uploaded to the database through:

1. **Optimistic Updates**: New posts appear instantly in the UI when created
2. **Real-time Subscriptions**: Posts from other users appear automatically via Supabase real-time
3. **Success Notifications**: Visual feedback confirms successful post creation
4. **Loading States**: Clear loading indicators during post creation

### ✅ Real-time Features
- Live post updates when other users create posts
- Real-time comment updates in post details
- Live upvote count updates
- Automatic notification for new posts

### ✅ Search & Filtering
- Search across post titles and content
- Filter by category/tag
- Sort by: Most Recent, Most Popular, Most Commented

## Usage

### Basic Integration
```jsx
import { Forum } from '../components/forum';

function App() {
  return (
    <div className="container mx-auto px-4 py-8">
      <Forum />
    </div>
  );
}
```

### Using Individual Components
```jsx
import { PostForm, PostItem, PostDetail } from '../components/forum';

function CustomForumPage() {
  const [posts, setPosts] = useState([]);
  const [selectedPost, setSelectedPost] = useState(null);

  const handlePostCreated = (newPost) => {
    setPosts(prev => [newPost, ...prev]);
  };

  if (selectedPost) {
    return (
      <PostDetail 
        post={selectedPost} 
        onBack={() => setSelectedPost(null)} 
      />
    );
  }

  return (
    <div>
      <PostForm onPostCreated={handlePostCreated} />
      
      {posts.map(post => (
        <PostItem
          key={post.id}
          post={post}
          onPostClick={setSelectedPost}
        />
      ))}
    </div>
  );
}
```

## Database Requirements

The forum system requires these database tables and views:
- `forum_posts` - Main posts table
- `forum_comments` - Comments table
- `post_upvotes` - Upvotes tracking
- `forum_posts_with_details` - View with aggregated data
- Real-time subscriptions enabled on the tables

## Styling

Components use Tailwind CSS classes and are fully responsive. The design includes:
- Clean, modern interface
- Consistent color scheme with role-based badges
- Smooth transitions and animations
- Loading states and success indicators

## Authentication

The forum system integrates with the AuthContext and requires:
- User authentication for posting and upvoting
- Profile information for author display
- Role-based styling (admin, teacher, staff, student)

## Real-time Configuration

Make sure your Supabase project has real-time enabled for:
```sql
-- Enable real-time on forum tables
ALTER TABLE forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE forum_comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE post_upvotes ENABLE ROW LEVEL SECURITY;
```

The components will automatically subscribe to changes and update the UI in real-time.
