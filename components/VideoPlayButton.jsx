import { TouchableOpacity, Image } from 'react-native';

const playIcon = require('../assets/icons/playback.png');
const pauseIcon = require('../assets/icons/pause.png');

export default function VideoPlayButton({ onPress, isPlaying }) {
  return (
    <TouchableOpacity
      onPress={onPress}
      className="absolute z-10 p-3 rounded-full -translate-y-2"
    >
      <Image
        source={isPlaying ? pauseIcon : playIcon}
        className="w-8 h-8"
        tintColor="white"
      />
    </TouchableOpacity>
  );
} 