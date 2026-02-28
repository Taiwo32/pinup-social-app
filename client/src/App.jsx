
import React from 'react'
import { Route, Routes } from 'react-router-dom'
import Feed from './pages/Feed'
import Messages from './pages/Messages'
import ChatBox from './pages/ChatBox'
import Connection from './pages/Connection'
import Discover from './pages/Discover'
import Profile from './pages/Profile'
import CreatePost from './pages/CreatePost'
import Login from './pages/Login'
import {useUser, useAuth} from '@clerk/clerk-react'
import Layout from './pages/Layout'
import { Toaster } from 'react-hot-toast'
import { useEffect } from 'react'
import { useDispatch } from 'react-redux'
import { fetchUser } from './features/user/userSlice'
import { fetchConnections } from './features/connections/connectionSlice'

const App = () => {

  const {user } = useUser();
  const {getToken} = useAuth();

  const dispatch = useDispatch();

  useEffect(()=>{
    const fetchData = async () => {
      if (user) {
        const token = await getToken()
        dispatch(fetchUser(token));
        dispatch(fetchConnections(token))
      }
    }
    fetchData();
    
  },[user, getToken, dispatch])

  return (
    <>
    <Toaster />
      <Routes>
        <Route path='/' element= {!user ?<Login />: <Layout />}>
          <Route index element={<Feed />} />
          <Route path='messages/' element={<Messages />}></Route>
          <Route path='messages/:userId' element={<ChatBox />}></Route>
          <Route path='connections' element={<Connection />}></Route>
          <Route path='discover' element={<Discover />}></Route>
          <Route path='profile' element={<Profile />}></Route>
          <Route path='profile/:profileId' element={<Profile />}></Route>
          <Route path='create-post' element={<CreatePost />}></Route>
        </Route>
      </Routes>
    </>
  )
}

export default App