import './index.css'

function UserInfo({ userInfo }) {
    if (!userInfo) {
        return null
    }

    return (
        <div className='userinfo'>
            <img className='avatar' src={userInfo.avatar_url} alt={userInfo.name} />
            <div className='user-details'>
                <span className='name'>{userInfo.name}</span>
                {userInfo.en_name && <span className='en-name'>{userInfo.en_name}</span>}
                {userInfo.email && <span className='email'>{userInfo.email}</span>}
            </div>
        </div>
    )
}

export default UserInfo
