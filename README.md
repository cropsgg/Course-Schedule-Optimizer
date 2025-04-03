# Course Schedule Optimizer

A modern web application that helps educational institutions generate optimal course timetables using advanced scheduling algorithms.

## Features

- **Automated Timetable Generation**: Quickly create efficient, conflict-free schedules
- **Smart Scheduling Algorithm**: Uses a greedy algorithm to optimize course placement
- **Building Structure Support**: Built specifically for Building AB3 with 7 floors and 15 rooms per floor
- **Class Type Handling**: Supports both Theory (1 slot) and Lab (2 slots) classes
- **Time Structure**: Implements 50-minute slots with 5-minute breaks from 8:00 AM to 7:20 PM
- **Extra-mural Hour**: Automatically blocks 1:20 PM - 2:00 PM for extra-mural activities
- **Teacher Room Reservation**: Reserves rooms 14 and 15 on each floor for teachers
- **Modern UI/UX**: Clean, responsive interface that works on all devices
- **Real-time Feedback**: Instant notifications for all actions

## Technical Details

### Algorithm
The application uses a greedy algorithm for scheduling optimization:
1. Lab classes are prioritized over theory classes
2. Room availability is checked across all 7 floors
3. Extra-mural hour is automatically blocked
4. Teacher rooms (14 and 15) are reserved
5. Multi-slot labs are handled properly in the timetable display

### Room Naming Convention
Rooms are identified using the format `Floor-RoomNumber` (e.g., `2-05` for floor 2, room 5)

### Time Slots
- Regular slots: 50 minutes with 5-minute breaks
- Complete schedule: 8:00 AM to 7:20 PM
- Extra-mural hour: 1:20 PM to 2:00 PM

### Technology Stack
- HTML5
- CSS3 (with modern features like CSS Grid and Flexbox)
- Vanilla JavaScript (ES6+)
- No external dependencies

## Usage

1. Open `index.html` in a modern web browser
2. Add courses using the form on the left:
   - Enter course name and code
   - Specify instructor
   - Select class type (Theory or Lab)
   - Optionally choose a specific floor and room
3. Click "Add Course" to add the course to the system
4. Repeat for all courses
5. Click "Generate Optimal Schedule" to create the timetable
6. View the optimized schedule in the timetable display
7. Use "Clear All" to start over

## Browser Support

The application works in all modern browsers:
- Chrome (latest)
- Firefox (latest)
- Safari (latest)
- Edge (latest)

## Development

To modify or enhance the application:

1. Clone the repository
2. Edit the source files:
   - `index.html` for structure
   - `styles.css` for styling
   - `script.js` for functionality
3. Test in your browser

## License

This project is open source and available under the MIT License. 