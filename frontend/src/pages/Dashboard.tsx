import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import Layout from '../components/Layout';

const Dashboard: React.FC = () => {
  const { user } = useAuth();

  const inspectorCards = [
    {
      title: 'Nieuwe Inspectie',
      description: 'Start een nieuwe inspectie',
      link: '/inspections/new',
      icon: 'M12 4v16m8-8H4',
      color: 'bg-primary-600 hover:bg-primary-700',
      textColor: 'text-white',
    },
    {
      title: 'Mijn Inspecties',
      description: 'Bekijk en beheer inspecties',
      link: '/inspections',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      color: 'bg-white hover:bg-gray-50 border-2 border-gray-200',
      textColor: 'text-gray-900',
    },
  ];

  const adminCards = [
    {
      title: 'Templates Beheren',
      description: 'Creëer en bewerk templates',
      link: '/templates',
      icon: 'M4 5a1 1 0 011-1h14a1 1 0 011 1v2a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM4 13a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H5a1 1 0 01-1-1v-6zM16 13a1 1 0 011-1h2a1 1 0 011 1v6a1 1 0 01-1 1h-2a1 1 0 01-1-1v-6z',
      color: 'bg-white hover:bg-gray-50 border-2 border-gray-200',
      textColor: 'text-gray-900',
    },
    {
      title: 'Gebruikers Beheren',
      description: 'Beheer gebruikers en rollen',
      link: '/users',
      icon: 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z',
      color: 'bg-white hover:bg-gray-50 border-2 border-gray-200',
      textColor: 'text-gray-900',
    },
    {
      title: 'Alle Inspecties',
      description: 'Bekijk alle inspecties',
      link: '/inspections',
      icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2',
      color: 'bg-white hover:bg-gray-50 border-2 border-gray-200',
      textColor: 'text-gray-900',
    },
  ];

  const cards = user?.role === 'ADMIN' ? adminCards : inspectorCards;

  return (
    <Layout>
      <div className="space-y-8">
        {/* Welcome Section */}
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Welkom, {user?.firstName}
          </h1>
          <p className="mt-2 text-gray-600">
            {user?.role === 'ADMIN'
              ? 'Beheer templates, gebruikers en bekijk alle inspecties'
              : 'Start nieuwe inspecties en bekijk uw resultaten'
            }
          </p>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, index) => (
            <Link
              key={index}
              to={card.link}
              className={`${card.color} rounded-lg shadow-sm p-6 transition-all hover:shadow-md`}
            >
              <div className="flex items-start space-x-4">
                <div className={`p-3 rounded-lg ${card.color === 'bg-primary-600 hover:bg-primary-700' ? 'bg-primary-700' : 'bg-primary-100'}`}>
                  <svg
                    className={`w-6 h-6 ${card.color === 'bg-primary-600 hover:bg-primary-700' ? 'text-white' : 'text-primary-600'}`}
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d={card.icon}
                    />
                  </svg>
                </div>
                <div className="flex-1">
                  <h3 className={`text-lg font-semibold ${card.textColor}`}>
                    {card.title}
                  </h3>
                  <p className={`mt-1 text-sm ${card.color === 'bg-primary-600 hover:bg-primary-700' ? 'text-primary-100' : 'text-gray-600'}`}>
                    {card.description}
                  </p>
                </div>
                <svg
                  className={`w-5 h-5 ${card.color === 'bg-primary-600 hover:bg-primary-700' ? 'text-primary-200' : 'text-gray-400'}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 5l7 7-7 7"
                  />
                </svg>
              </div>
            </Link>
          ))}
        </div>

        {/* Recent Activity */}
        <div className="bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recente Activiteit</h2>
          <div className="text-center py-12 text-gray-500">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01"
              />
            </svg>
            <p>Nog geen recente activiteit</p>
            <p className="text-sm mt-1">Start een nieuwe inspectie om te beginnen</p>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Dashboard;
