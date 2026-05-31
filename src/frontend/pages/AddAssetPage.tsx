import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCollection } from '../context/CollectionContext';
import { InstanceForm } from '../components/forms/InstanceForm';

export const AddAssetPage: React.FC = () =>
{
  const navigate = useNavigate();
  const { refresh } = useCollection();

  const handleSuccess = () =>
  {
    refresh();
    navigate('/');
  };

  return <InstanceForm onSuccess={handleSuccess} />;
};
