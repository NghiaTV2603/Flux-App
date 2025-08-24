-- Create databases for each service
CREATE DATABASE flux_auth_db;
CREATE DATABASE flux_user_db;
CREATE DATABASE flux_server_db;
CREATE DATABASE flux_message_db;
CREATE DATABASE flux_realtime_db;
CREATE DATABASE flux_channel_db;
CREATE DATABASE flux_friend_db;
CREATE DATABASE flux_file_db;
CREATE DATABASE flux_role_db;
CREATE DATABASE flux_voice_db;
CREATE DATABASE flux_security_db;

-- Grant permissions
GRANT ALL PRIVILEGES ON DATABASE flux_auth_db TO flux_user;
GRANT ALL PRIVILEGES ON DATABASE flux_user_db TO flux_user;
GRANT ALL PRIVILEGES ON DATABASE flux_server_db TO flux_user;
GRANT ALL PRIVILEGES ON DATABASE flux_message_db TO flux_user;
GRANT ALL PRIVILEGES ON DATABASE flux_realtime_db TO flux_user;
GRANT ALL PRIVILEGES ON DATABASE flux_channel_db TO flux_user;
GRANT ALL PRIVILEGES ON DATABASE flux_friend_db TO flux_user;
GRANT ALL PRIVILEGES ON DATABASE flux_file_db TO flux_user;
GRANT ALL PRIVILEGES ON DATABASE flux_role_db TO flux_user;
GRANT ALL PRIVILEGES ON DATABASE flux_voice_db TO flux_user;
GRANT ALL PRIVILEGES ON DATABASE flux_security_db TO flux_user; 