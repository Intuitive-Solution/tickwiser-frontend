[![Contributors](https://img.shields.io/github/contributors/Intuitive-Solution/tickwiser-frontend?style=flat-square)](https://github.com/Intuitive-Solution/tickwiser-frontend/graphs/contributors)

[![Netlify Status](https://api.netlify.com/api/v1/badges/b08d84e2-522f-422b-b3b0-13caebcf2feb/deploy-status)](https://app.netlify.com/projects/tickwiser/deploys)

# TickWiser Frontend

A modern, responsive Todo application built with Vue 3 and Vite. This frontend connects to a Laravel backend API to manage tasks with features like task creation, completion tracking, and audio feedback.

## 🚀 Features

- ✅ **Task Management**: Create, update, and delete tasks
- 🎯 **Smart Filtering**: Shows only incomplete tasks (status: 0)
- 🔊 **Audio Feedback**: Pleasant ding sound when completing tasks
- 📅 **Date Management**: Automatic date defaulting to today
- 🎨 **Clean UI**: Simple and intuitive user interface
- ⚡ **Real-time Updates**: Instant task status updates

## 🛠️ Tech Stack

- **Vue 3** - Progressive JavaScript framework
- **Vite** - Fast build tool and dev server
- **Axios** - HTTP client for API requests
- **Web Audio API** - For task completion sound effects

## 📋 Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Laravel backend API running (see backend documentation)

## 🔧 Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd todo-frontend
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   VITE_API_BASE_URL=http://127.0.0.1:8000/api
   ```
   
   For production deployment:
   ```env
   VITE_API_BASE_URL=https://your-backend-domain.com/api
   ```

## 🚀 Development

### Start Development Server
```bash
npm run dev
```
The app will be available at `http://localhost:5173`

### Build for Production
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 🏗️ Project Structure

```
src/
├── components/          # Vue components
├── services/
│   └── api.js          # Axios API configuration
├── assets/             # Static assets
├── App.vue             # Main application component
└── main.js             # Application entry point
```

## 🔌 API Integration

The frontend communicates with a Laravel backend through RESTful API endpoints:

- `GET /api/tasks` - Fetch all tasks
- `POST /api/tasks` - Create new task
- `PUT /api/tasks/{id}` - Update task status
- `DELETE /api/tasks/{id}` - Delete task

### API Configuration

The API base URL is configured in `src/services/api.js`:
```javascript
const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://127.0.0.1:8000/api',
});
```

## 🎵 Audio Features

The app includes a pleasant ding sound when tasks are completed, implemented using the Web Audio API:
- Plays only when marking tasks as complete
- No external audio files required
- Works in all modern browsers

## 🎨 Customization

### Styling
The app uses simple CSS styling. You can customize the appearance by modifying the `<style>` section in `App.vue`.

### Sound Effects
To modify the completion sound, edit the `playDingSound()` function in `App.vue`:
```javascript
// Adjust frequency, duration, and volume
oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
```

## 🌐 Deployment

### Netlify Deployment
1. Build the project: `npm run build`
2. Deploy the `dist` folder to Netlify
3. Set environment variables in Netlify dashboard:
   - `VITE_API_BASE_URL`: Your backend API URL

### Other Platforms
The built files in the `dist` folder can be deployed to any static hosting service.

## 🔧 Configuration

### Vite Configuration
See `vite.config.js` for build and development server settings.

### Environment Variables
- `VITE_API_BASE_URL`: Backend API base URL

## 🐛 Troubleshooting

### Common Issues

1. **CORS Errors**
   - Ensure your backend has proper CORS configuration
   - Check that the API URL is correct

2. **API Connection Issues**
   - Verify the backend server is running
   - Check the `VITE_API_BASE_URL` environment variable

3. **Build Issues**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check Node.js version compatibility

## 📝 Development Notes

- Tasks with status `true` or `1` are considered complete and filtered out
- The app automatically sets today's date for new tasks
- Audio feedback requires user interaction to work (browser security policy)

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## 📄 License

This project is licensed under the MIT License.

## 🔗 Related

- [Laravel Backend Repository](link-to-backend-repo)
- [Live Demo](https://todo-app-intutive.netlify.app)

---

Built with ❤️ using Vue 3 and Vite
