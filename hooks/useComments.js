import { useState, useEffect, useRef } from 'react';
import { fetchCommentsData } from '../services/commentService';

export default function useComments(videoId, refreshFlag) {
  const [commentsDoc, setCommentsDoc] = useState([]);
  const isMounted = useRef(true);

  useEffect(() => {
    isMounted.current = true;

    const fetchComments = async () => {
      const data = await fetchCommentsData(videoId);
      if (isMounted.current) {
        setCommentsDoc(data);
      }
    };

    fetchComments();

    return () => {
      isMounted.current = false;
    };
  }, [videoId, refreshFlag]);

  return [commentsDoc, setCommentsDoc];
}
