import React from 'react'
import { Link } from 'react-router-dom'

export default function NotFound(){
  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-semibold mb-2">Page not found</h1>
      <p className="mb-4">The page you’re looking for doesn’t exist.</p>
      <Link className="btn" to="/login">Go to sign in</Link>
    </div>
  )
}
