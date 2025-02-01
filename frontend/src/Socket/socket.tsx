import io from 'socket.io-client'
const socketIO = (server: string) => {
	return io(server, {
		autoConnect: false,
		withCredentials: true
	})
}
export default socketIO