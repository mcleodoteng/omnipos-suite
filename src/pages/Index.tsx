import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { usePOS } from '@/contexts/POSContext';
import { Login } from './Login';

const Index = () => {
  const navigate = useNavigate();
  const { currentUser } = usePOS();

  useEffect(() => {
    if (currentUser) {
      navigate('/dashboard');
    }
  }, [currentUser, navigate]);

  return <Login />;
};

export default Index;
