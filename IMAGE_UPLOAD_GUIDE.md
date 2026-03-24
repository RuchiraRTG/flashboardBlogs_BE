# Image Upload & Rich Text Editor Integration Guide

## Overview
This backend provides a complete image upload solution integrated with AWS S3 for the blog article creation system.

**Flow:**
```
Frontend (Rich Text Editor) → Backend API → AWS S3 Bucket
                                    ↓
                              MongoDB (metadata)
```

---

## API Endpoints

### 1. Upload Image
**POST** `/api/images/upload`

Upload a single image to S3 and receive the URL.

**Request:**
- Content-Type: `multipart/form-data`
- Field name: `image`
- Max file size: 10MB (configurable via `MAX_FILE_SIZE` in .env)
- Allowed types: JPEG, PNG, WebP, GIF

**Example (JavaScript/Fetch):**
```javascript
const formData = new FormData();
formData.append('image', imageFile); // File object from input

const response = await fetch('http://localhost:5001/api/images/upload', {
  method: 'POST',
  body: formData
});

const result = await response.json();
// result = {
//   success: true,
//   message: "Image uploaded successfully",
//   data: {
//     url: "https://flashbroadfacts.s3.us-east-1.amazonaws.com/article-images/1234567890-uuid.jpg",
//     fileName: "uuid.jpg",
//     s3Key: "article-images/1234567890-uuid.jpg",
//     size: 102400,
//     mimeType: "image/jpeg"
//   }
// }
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Image uploaded successfully",
  "data": {
    "url": "https://flashbroadfacts.s3.us-east-1.amazonaws.com/article-images/1234567890-uuid.jpg",
    "fileName": "uuid.jpg",
    "s3Key": "article-images/1234567890-uuid.jpg",
    "size": 102400,
    "mimeType": "image/jpeg"
  }
}
```

**Response (Error):**
```json
{
  "success": false,
  "message": "Invalid file type. Allowed: JPEG, PNG, WebP, GIF"
}
```

---

### 2. Delete Image
**DELETE** `/api/images/:s3Key`

Delete an image from S3 (URL-encode the S3 key in the URL).

**Example:**
```javascript
const s3Key = "article-images/1234567890-uuid.jpg";
const encodedKey = encodeURIComponent(s3Key);

const response = await fetch(
  `http://localhost:5001/api/images/${encodedKey}`,
  { method: 'DELETE' }
);

const result = await response.json();
// result = { success: true, message: "Image deleted successfully" }
```

---

### 3. Extract Images from HTML
**POST** `/api/images/extract-from-html`

Parse HTML body and extract all embedded S3 image references.

**Request:**
```json
{
  "html": "<p><img src='https://flashbroadfacts.s3.us-east-1.amazonaws.com/article-images/1234567890-uuid.jpg'/></p>"
}
```

**Response:**
```json
{
  "success": true,
  "images": [
    {
      "url": "https://flashbroadfacts.s3.us-east-1.amazonaws.com/article-images/1234567890-uuid.jpg",
      "s3Key": "article-images/1234567890-uuid.jpg"
    }
  ]
}
```

---

## Frontend Integration Example (React + Rich Text Editor)

### 1. Install Dependencies
```bash
npm install react-quill quill  # or your preferred rich text editor
```

### 2. Rich Text Editor Component
```jsx
import { useState } from 'react';
import ReactQuill from 'react-quill';
import 'react-quill.css';

export default function ArticleEditor() {
  const [content, setContent] = useState('');
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  // Handle image upload from editor
  const handleImageUpload = async (file) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload an image file');
      return;
    }

    setUploading(true);
    const formData = new FormData();
    formData.append('image', file);

    try {
      const response = await fetch('http://localhost:5001/api/images/upload', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();

      if (result.success) {
        // Insert image URL into editor
        const editor = quillRef.current.getEditor();
        const range = editor.getSelection();
        editor.insertEmbed(range.index, 'image', result.data.url);

        // Track uploaded images for later cleanup
        setImages((prev) => [...prev, result.data.s3Key]);
      } else {
        alert(result.message);
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  // Quill modules configuration
  const modules = {
    toolbar: {
      container: [
        ['bold', 'italic', 'underline'],
        ['image', 'link'],
        ['clean']
      ],
      handlers: {
        image: () => {
          const input = document.createElement('input');
          input.setAttribute('type', 'file');
          input.setAttribute('accept', 'image/*');
          input.onchange = () => handleImageUpload(input.files[0]);
          input.click();
        }
      }
    }
  };

  return (
    <div>
      <ReactQuill
        ref={quillRef}
        value={content}
        onChange={setContent}
        modules={modules}
        placeholder="Write your article..."
      />
      <button 
        onClick={() => saveArticle(content, images)}
        disabled={uploading}
      >
        {uploading ? 'Uploading...' : 'Save Article'}
      </button>
    </div>
  );
}
```

### 3. Save Article to Backend
```javascript
const saveArticle = async (htmlContent, uploadedImageKeys) => {
  const articleData = {
    slug: 'my-article-slug',
    topic: 'topic-id-from-mongodb',
    en: {
      title: 'My Article Title',
      category: 'Technology',
      topic: 'Web Development',
      image: 'https://...hero-image-url...', // Optional hero image
      body: htmlContent, // Contains inline <img> tags with S3 URLs
      embeddedImages: uploadedImageKeys.map((key) => ({
        s3Key: key,
        url: `https://flashbroadfacts.s3.us-east-1.amazonaws.com/${key}`
      }))
    },
    si: {
      // Sinhala translation...
    },
    isPublished: true
  };

  const response = await fetch('http://localhost:5001/api/articles', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(articleData)
  });

  const result = await response.json();
  if (result.success) {
    console.log('Article saved:', result.data);
  }
};
```

---

## Security Features

### 1. **File Type Validation**
   - Checked at both Multer and service level
   - Only JPEG, PNG, WebP, GIF allowed
   - Verified via MIME type

### 2. **File Size Limits**
   - 10MB by default (configurable)
   - Enforced at Multer and request level

### 3. **UUID File Naming**
   - Prevents directory traversal attacks
   - Original filename discarded; UUID used instead
   - Format: `{UUID}.{ext}`

### 4. **S3 Access Control**
   - `ACL: public-read` — images are publicly viewable
   - Credentials stored in environment variables (never in code)
   - No sensitive data in file metadata

### 5. **XSS Prevention**
   - Article HTML sanitized on backend (script tags removed)
   - Content Security Policy headers set
   - Frontend can safely use `dangerouslySetInnerHTML`

### 6. **Rate Limiting**
   - 10 uploads per minute per IP address
   - Prevents abuse and DDoS

### 7. **Production Security**
   - Use IAM roles instead of hardcoded AWS credentials
   - Enable HTTPS only
   - Store sensitive credentials in Secrets Manager

---

## Environment Variables

```bash
# .env file
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
AWS_S3_BUCKET=flashbroadfacts

MAX_FILE_SIZE=10485760  # 10MB in bytes
ALLOWED_IMAGE_TYPES=image/jpeg,image/png,image/webp,image/gif

NODE_ENV=development  # Set to 'production' for production
```

---

## Cleanup on Article Deletion

When an article is deleted, all embedded images are automatically removed from S3:

```javascript
// DELETE /api/articles/:slug
// Automatically deletes all associated S3 images
```

**Tracked by:** `article.en.embeddedImages[]` and `article.si.embeddedImages[]`

---

## Database Schema (ArticleModel)

```javascript
article.en = {
  title: "Article Title",
  category: "Technology",
  topic: "Web Dev",
  image: "https://...s3-url...", // Hero image
  body: "<p><img src='https://...'/></p>", // HTML with embedded images
  embeddedImages: [
    {
      s3Key: "article-images/1234567890-uuid.jpg",
      url: "https://flashbroadfacts.s3.us-east-1.amazonaws.com/article-images/1234567890-uuid.jpg",
      addedAt: "2024-03-10T12:00:00Z"
    }
  ]
}
```

---

## Error Handling

**Common errors:**

| Error | Cause | Solution |
|-------|-------|----------|
| 400 - Invalid file type | Uploaded non-image file | Use only JPEG/PNG/WebP/GIF |
| 413 - File too large | File exceeds 10MB | Compress image before upload |
| 429 - Too many requests | Rate limit exceeded | Wait 60 seconds before next upload |
| 500 - S3 Connection Error | AWS credentials invalid | Verify .env file and regenerate keys |

---

## Testing with cURL

```bash
# Upload image
curl -F "image=@path/to/image.jpg" \
  http://localhost:5001/api/images/upload

# Delete image
curl -X DELETE \
  "http://localhost:5001/api/images/article-images%2F1234567890-uuid.jpg"

# Extract images from HTML
curl -X POST http://localhost:5001/api/images/extract-from-html \
  -H "Content-Type: application/json" \
  -d '{"html":"<img src='"'"'https://...'"'"'/>"}'
```

---

## Production Deployment Checklist

- [ ] Rotate AWS credentials (current ones were exposed in development)
- [ ] Use IAM roles instead of hardcoded credentials
- [ ] Enable HTTPS/SSL
- [ ] Set `NODE_ENV=production`
- [ ] Use a production-grade rate limiting service (e.g., Redis-based)
- [ ] Enable S3 versioning for accidental deletion recovery
- [ ] Set up CloudFront CDN for faster image delivery
- [ ] Enable S3 bucket encryption (server-side)
- [ ] Configure S3 CORS if frontend is on different domain
- [ ] Set up CloudWatch logging for monitoring
- [ ] Add authentication to image endpoints (optional)
