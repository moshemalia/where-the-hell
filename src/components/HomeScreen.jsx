import React, { useState } from "react"
import { useRooms } from "../hooks/useRooms"

export default function HomeScreen() {
  const [selectedRoom, setSelectedRoom] = useState(null)
  const { rooms, loading } = useRooms()

  const handleEditRoom = (room) => {
    setSelectedRoom(room)
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div>
      {rooms.map((room) => (
        <div
          key={room.room_id}
          className="absolute transform -translate-x-1/2 -translate-y-1/2 group"
          style={{
            left: `${room.x}%`,
            top: `${room.y}%`
          }}
        >
          <div
            className="bg-red-500 hover:bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center text-xs font-bold shadow-lg cursor-pointer"
            onClick={() => handleEditRoom(room)}
          >
            {room.room_number}
          </div>
        </div>
      ))}

      {selectedRoom && (
        <div className="fixed top-0 left-0 w-full h-full bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded p-4 shadow-lg">
            <h2 className="text-lg font-bold mb-2">Room details</h2>
            <div>Name: {selectedRoom.room_name}</div>
            <div>Number: {selectedRoom.room_number}</div>
            <button
              className="mt-4 bg-blue-500 text-white px-4 py-2 rounded"
              onClick={() => setSelectedRoom(null)}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
