import {createSlice} from '@reduxjs/toolkit'

const initialState = {
    message : []
}

const messageSlice = createSlice({
    name: 'message',
    initialState,
    reducers: {

    }
})

export default messageSlice.reducer;