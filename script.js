// Course class to represent a course
class Course {
    constructor(name, code, instructor, type, floor = null, room = null) {
        this.name = name;
        this.code = code;
        this.instructor = instructor;
        this.type = type; // 'theory' or 'lab'
        this.floor = floor;
        this.room = room;
        this.scheduled = false;
        this.day = null;
        this.timeSlot = null;
    }

    // Get duration in slots
    get duration() {
        return this.type === 'lab' ? 2 : 1;
    }

    // Get formatted room display
    get roomDisplay() {
        if (this.floor && this.room) {
            return `${this.floor}-${this.room.toString().padStart(2, '0')}`;
        }
        return 'Not assigned';
    }
}

// Schedule class to manage the timetable
class Schedule {
    constructor() {
        this.courses = [];
        this.timeSlots = [
            '8:00 AM', '8:55 AM', '9:50 AM', '10:45 AM', '11:40 AM', 
            '12:35 PM', '1:20 PM', '2:00 PM', '2:55 PM', '3:50 PM', 
            '4:45 PM', '5:40 PM', '6:35 PM'
        ];
        this.displayTimeSlots = [
            '8:00 - 8:50', '8:55 - 9:45', '9:50 - 10:40', '10:45 - 11:35', '11:40 - 12:30', 
            '12:35 - 1:15', '1:20 - 2:00', '2:00 - 2:50', '2:55 - 3:45', '3:50 - 4:40', 
            '4:45 - 5:35', '5:40 - 6:30', '6:35 - 7:20'
        ];
        this.days = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'];
        this.grid = this.initializeGrid();
        this.rooms = this.initializeRooms();
    }

    // Initialize the schedule grid
    initializeGrid() {
        const grid = {};
        this.days.forEach(day => {
            grid[day] = {};
            this.timeSlots.forEach(time => {
                grid[day][time] = null;
            });
        });
        return grid;
    }

    // Initialize available rooms
    initializeRooms() {
        const rooms = {};
        for (let floor = 1; floor <= 7; floor++) {
            rooms[floor] = {};
            for (let room = 1; room <= 13; room++) {
                rooms[floor][room] = true; // Available
            }
            // Rooms 14 and 15 are reserved for teachers
            rooms[floor][14] = false;
            rooms[floor][15] = false;
        }
        return rooms;
    }

    // Add a course to the list
    addCourse(course) {
        this.courses.push(course);
        this.updateCourseList();
        this.showNotification('Course added successfully!', 'success');
    }

    // Check if a time slot is available
    isTimeSlotAvailable(day, timeIndex, duration) {
        // Extra-mural hour check (1:20 PM - 2:00 PM)
        if (timeIndex === 6 || (timeIndex < 6 && timeIndex + duration > 6)) {
            return false;
        }

        for (let i = 0; i < duration; i++) {
            const currentTimeIndex = timeIndex + i;
            // Skip if we go beyond available time slots
            if (currentTimeIndex >= this.timeSlots.length) {
                return false;
            }
            const currentTime = this.timeSlots[currentTimeIndex];
            if (this.grid[day][currentTime] !== null) {
                return false;
            }
        }
        return true;
    }

    // Find an available room
    findAvailableRoom(floor = null) {
        // If floor is specified, try to find a room on that floor
        if (floor) {
            for (let room = 1; room <= 13; room++) {
                if (this.rooms[floor][room]) {
                    return { floor, room };
                }
            }
            return null;
        }

        // Otherwise, find any available room
        for (let floor = 1; floor <= 7; floor++) {
            for (let room = 1; room <= 13; room++) {
                if (this.rooms[floor][room]) {
                    return { floor, room };
                }
            }
        }
        return null;
    }

    // Find the first available time slot for a course
    findAvailableTimeSlot(course) {
        for (const day of this.days) {
            for (let i = 0; i < this.timeSlots.length; i++) {
                if (this.isTimeSlotAvailable(day, i, course.duration)) {
                    const timeSlot = this.timeSlots[i];
                    return { day, timeSlot, timeIndex: i };
                }
            }
        }
        return null;
    }

    // Check if a room is available for a specific time
    isRoomAvailable(floor, room, day, timeIndex, duration) {
        for (let i = 0; i < duration; i++) {
            const currentTimeIndex = timeIndex + i;
            if (currentTimeIndex >= this.timeSlots.length) {
                return false;
            }
            
            const currentTime = this.timeSlots[currentTimeIndex];
            const courseInSlot = this.grid[day][currentTime];
            
            if (courseInSlot && courseInSlot.floor === floor && courseInSlot.room === room) {
                return false;
            }
        }
        return true;
    }

    // Schedule a course using the optimal algorithm
    scheduleCourse(course) {
        const timeSlotInfo = this.findAvailableTimeSlot(course);
        if (!timeSlotInfo) {
            return false;
        }

        const { day, timeSlot, timeIndex } = timeSlotInfo;

        // If course has preferred floor/room, try to use it
        let roomAssigned = false;
        if (course.floor && course.room) {
            if (this.rooms[course.floor][course.room] && 
                this.isRoomAvailable(course.floor, course.room, day, timeIndex, course.duration)) {
                roomAssigned = true;
            } else {
                // Clear the preferred room as it's not available
                course.floor = null;
                course.room = null;
            }
        }

        // If no room assigned yet, find an available one
        if (!roomAssigned) {
            const availableRoom = this.findAvailableRoom(course.floor);
            if (!availableRoom) {
                this.showNotification('No available rooms found!', 'error');
                return false;
            }
            course.floor = availableRoom.floor;
            course.room = availableRoom.room;
        }

        // Schedule the course for all required time slots
        for (let i = 0; i < course.duration; i++) {
            const currentTimeIndex = timeIndex + i;
            const currentTime = this.timeSlots[currentTimeIndex];
            this.grid[day][currentTime] = course;
        }

        // Mark the room as used
        this.rooms[course.floor][course.room] = false;

        course.scheduled = true;
        course.day = day;
        course.timeSlot = timeSlot;
        return true;
    }

    // Generate an optimal schedule using a greedy algorithm
    generateOptimalSchedule() {
        if (this.courses.length === 0) {
            this.showNotification('Please add courses before generating a schedule!', 'warning');
            return;
        }

        // Reset scheduling state
        this.rooms = this.initializeRooms();
        this.grid = this.initializeGrid();
        this.courses.forEach(course => {
            course.scheduled = false;
            course.day = null;
            course.timeSlot = null;
        });

        // Sort courses by type (labs first) and then by duration
        this.courses.sort((a, b) => {
            if (a.type === 'lab' && b.type !== 'lab') return -1;
            if (a.type !== 'lab' && b.type === 'lab') return 1;
            return 0;
        });

        let allScheduled = true;
        let scheduledCount = 0;

        for (const course of this.courses) {
            const success = this.scheduleCourse(course);
            if (success) {
                scheduledCount++;
            } else {
                allScheduled = false;
            }
        }

        this.updateCourseList();

        if (allScheduled) {
            this.showNotification(`All ${this.courses.length} courses scheduled successfully!`, 'success');
        } else {
            this.showNotification(`Scheduled ${scheduledCount} of ${this.courses.length} courses. Some could not be scheduled due to constraints.`, 'warning');
        }

        this.generateTimetable();
    }

    // Remove a course from the schedule
    removeCourse(index) {
        const course = this.courses[index];
        
        // If the course was scheduled, free up its slots and room
        if (course.scheduled) {
            for (const day of this.days) {
                for (const time of this.timeSlots) {
                    if (this.grid[day][time] === course) {
                        this.grid[day][time] = null;
                    }
                }
            }
            
            // Make the room available again
            if (course.floor && course.room) {
                this.rooms[course.floor][course.room] = true;
            }
        }
        
        // Remove the course from the list
        this.courses.splice(index, 1);
        this.updateCourseList();
        this.showNotification('Course removed successfully!', 'success');
    }

    // Clear the current schedule
    clearSchedule() {
        this.courses = [];
        this.grid = this.initializeGrid();
        this.rooms = this.initializeRooms();
        this.updateCourseList();
        
        // Clear the timetable display
        const timetableContainer = document.getElementById('timetable');
        timetableContainer.innerHTML = '';
        
        this.showNotification('Schedule cleared!', 'success');
    }

    // Update the course list display
    updateCourseList() {
        const courseListBody = document.querySelector('#courseList tbody');
        courseListBody.innerHTML = '';
        
        this.courses.forEach((course, index) => {
            const row = document.createElement('tr');
            
            const nameCell = document.createElement('td');
            nameCell.innerHTML = `${course.name}<br><span class="course-code">${course.code}</span>`;
            
            const instructorCell = document.createElement('td');
            instructorCell.textContent = course.instructor;
            
            const typeCell = document.createElement('td');
            typeCell.textContent = course.type === 'theory' ? 'Theory' : 'Lab';
            
            const roomCell = document.createElement('td');
            roomCell.textContent = course.scheduled ? course.roomDisplay : 'Not scheduled';
            
            const actionsCell = document.createElement('td');
            const removeBtn = document.createElement('button');
            removeBtn.className = 'btn danger';
            removeBtn.textContent = 'Remove';
            removeBtn.addEventListener('click', () => this.removeCourse(index));
            actionsCell.appendChild(removeBtn);
            
            row.appendChild(nameCell);
            row.appendChild(instructorCell);
            row.appendChild(typeCell);
            row.appendChild(roomCell);
            row.appendChild(actionsCell);
            
            courseListBody.appendChild(row);
        });
    }

    // Generate the timetable display
    generateTimetable() {
        const timetableContainer = document.getElementById('timetable');
        timetableContainer.innerHTML = '';
        
        const table = document.createElement('table');
        table.className = 'timetable';
        
        // Create table header
        const thead = document.createElement('thead');
        const headerRow = document.createElement('tr');
        
        const timeHeader = document.createElement('th');
        timeHeader.className = 'time-header';
        timeHeader.textContent = 'Time / Day';
        headerRow.appendChild(timeHeader);
        
        this.days.forEach(day => {
            const dayHeader = document.createElement('th');
            dayHeader.textContent = day;
            headerRow.appendChild(dayHeader);
        });
        
        thead.appendChild(headerRow);
        table.appendChild(thead);
        
        // Create table body
        const tbody = document.createElement('tbody');
        
        this.displayTimeSlots.forEach((displayTime, index) => {
            const row = document.createElement('tr');
            
            const timeCell = document.createElement('td');
            timeCell.className = 'time-slot';
            timeCell.textContent = displayTime;
            row.appendChild(timeCell);
            
            // Extra-mural hour special handling
            if (index === 6) { // 1:20 - 2:00 PM slot
                this.days.forEach(day => {
                    const extramuralCell = document.createElement('td');
                    extramuralCell.className = 'extramural';
                    extramuralCell.textContent = 'Extra-mural Hour';
                    row.appendChild(extramuralCell);
                });
            } else {
                const time = this.timeSlots[index];
                
                this.days.forEach(day => {
                    const dayCell = document.createElement('td');
                    const course = this.grid[day][time];
                    
                    if (course) {
                        // Skip if this is a continuation of a multi-slot course
                        if (index > 0 && this.grid[day][this.timeSlots[index - 1]] === course) {
                            return;
                        }
                        
                        // Create course display
                        const courseCell = document.createElement('div');
                        courseCell.className = `course-cell ${course.type}`;
                        
                        const courseName = document.createElement('div');
                        courseName.className = 'course-name';
                        courseName.textContent = `${course.code}`;
                        
                        const courseInstructor = document.createElement('div');
                        courseInstructor.className = 'course-instructor';
                        courseInstructor.textContent = course.instructor;
                        
                        const courseRoom = document.createElement('div');
                        courseRoom.className = 'course-room';
                        courseRoom.textContent = course.roomDisplay;
                        
                        courseCell.appendChild(courseName);
                        courseCell.appendChild(courseInstructor);
                        courseCell.appendChild(courseRoom);
                        
                        dayCell.appendChild(courseCell);
                        
                        // Set rowspan for lab courses
                        if (course.type === 'lab') {
                            dayCell.rowSpan = 2;
                        }
                    }
                    
                    row.appendChild(dayCell);
                });
            }
            
            tbody.appendChild(row);
        });
        
        table.appendChild(tbody);
        timetableContainer.appendChild(table);
    }

    // Show notification messages
    showNotification(message, type) {
        const notification = document.getElementById('notification');
        notification.textContent = message;
        notification.className = `notification ${type} show`;
        
        setTimeout(() => {
            notification.className = 'notification';
        }, 3000);
    }
}

// Initialize the schedule
const schedule = new Schedule();

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    const addCourseBtn = document.getElementById('addCourse');
    const generateScheduleBtn = document.getElementById('generateSchedule');
    const clearScheduleBtn = document.getElementById('clearSchedule');
    const floorSelect = document.getElementById('floor');
    const roomSelect = document.getElementById('room');

    // When floor changes, update available rooms
    floorSelect.addEventListener('change', () => {
        const floor = floorSelect.value;
        roomSelect.innerHTML = '<option value="">Auto-assign</option>';
        
        if (floor) {
            for (let room = 1; room <= 13; room++) {
                const option = document.createElement('option');
                option.value = room;
                option.textContent = `Room ${room}`;
                roomSelect.appendChild(option);
            }
            
            // Add teacher rooms as disabled options
            for (let room = 14; room <= 15; room++) {
                const option = document.createElement('option');
                option.value = room;
                option.textContent = `Room ${room} (Teacher Only)`;
                option.disabled = true;
                roomSelect.appendChild(option);
            }
        }
    });

    addCourseBtn.addEventListener('click', () => {
        const courseName = document.getElementById('courseName').value.trim();
        const courseCode = document.getElementById('courseCode').value.trim();
        const instructor = document.getElementById('instructor').value.trim();
        const classType = document.getElementById('classType').value;
        const floor = floorSelect.value ? parseInt(floorSelect.value) : null;
        const room = roomSelect.value ? parseInt(roomSelect.value) : null;

        if (!courseName || !courseCode || !instructor) {
            schedule.showNotification('Please fill in all required fields!', 'error');
            return;
        }

        // Validate that teacher rooms (14 and 15) are not selected
        if (room && (room === 14 || room === 15)) {
            schedule.showNotification('Rooms 14 and 15 are reserved for teachers only!', 'error');
            return;
        }

        const course = new Course(courseName, courseCode, instructor, classType, floor, room);
        schedule.addCourse(course);

        // Clear input fields
        document.getElementById('courseName').value = '';
        document.getElementById('courseCode').value = '';
        document.getElementById('instructor').value = '';
        document.getElementById('classType').value = 'theory';
        document.getElementById('floor').value = '';
        document.getElementById('room').innerHTML = '<option value="">Auto-assign</option>';
    });

    generateScheduleBtn.addEventListener('click', () => {
        schedule.generateOptimalSchedule();
    });

    clearScheduleBtn.addEventListener('click', () => {
        if (confirm('Are you sure you want to clear all courses and the schedule?')) {
            schedule.clearSchedule();
        }
    });
}); 