import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Fragment } from 'react';
import { Dialog, Transition } from '@headlessui/react';
import { XMarkIcon } from '@heroicons/react/24/outline';
import {
  HomeIcon,
  UsersIcon,
  CreditCardIcon,
  DocumentTextIcon,
  BanknotesIcon,
  LifebuoyIcon,
  ChartBarIcon,
  CogIcon,
  RectangleStackIcon,
  CalendarDaysIcon
} from '@heroicons/react/24/outline';
import { useAuth } from '../../hooks/useAuth';
import { clsx } from 'clsx';

const navigation = [
  { name: 'Dashboard', href: '/dashboard', icon: HomeIcon, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'ENGINEER', 'CASHIER'] },
  { name: 'Customers', href: '/customers', icon: UsersIcon, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SUPPORT'] },
  { name: 'Plans', href: '/plans', icon: RectangleStackIcon, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { name: 'Subscriptions', href: '/subscriptions', icon: CreditCardIcon, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SUPPORT'] },
  { name: 'Billing', href: '/billing', icon: CalendarDaysIcon, roles: ['OWNER', 'ADMIN'] },
  { name: 'Invoices', href: '/invoices', icon: DocumentTextIcon, roles: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] },
  { name: 'Payments', href: '/payments', icon: BanknotesIcon, roles: ['OWNER', 'ADMIN', 'MANAGER', 'CASHIER'] },
  { name: 'Tickets', href: '/tickets', icon: LifebuoyIcon, roles: ['OWNER', 'ADMIN', 'MANAGER', 'SUPPORT', 'ENGINEER'] },
  { name: 'Reports', href: '/reports', icon: ChartBarIcon, roles: ['OWNER', 'ADMIN', 'MANAGER'] },
  { name: 'Settings', href: '/settings', icon: CogIcon, roles: ['OWNER', 'ADMIN'] },
];

interface SidebarProps {
  open: boolean;
  onClose: () => void;
}

export function Sidebar({ open, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuth();

  const filteredNavigation = navigation.filter(item => 
    user && item.roles.includes(user.role)
  );

  const SidebarContent = () => (
    <div className="flex grow flex-col gap-y-5 overflow-y-auto bg-white dark:bg-gray-800 px-6 pb-4 ring-1 ring-gray-900/10 dark:ring-gray-700/10">
      <div className="flex h-16 shrink-0 items-center">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">ISP</span>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
              {user?.tenant.name}
            </h1>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              Billing System
            </p>
          </div>
        </div>
      </div>
      
      <nav className="flex flex-1 flex-col">
        <ul role="list" className="flex flex-1 flex-col gap-y-7">
          <li>
            <ul role="list" className="-mx-2 space-y-1">
              {filteredNavigation.map((item) => {
                const isActive = location.pathname.startsWith(item.href);
                return (
                  <li key={item.name}>
                    <Link
                      to={item.href}
                      onClick={onClose}
                      className={clsx(
                        isActive
                          ? 'bg-indigo-50 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400'
                          : 'text-gray-700 dark:text-gray-300 hover:text-indigo-600 dark:hover:text-indigo-400 hover:bg-gray-50 dark:hover:bg-gray-700',
                        'group flex gap-x-3 rounded-md p-2 text-sm leading-6 font-medium transition-colors'
                      )}
                    >
                      <item.icon className="h-5 w-5 shrink-0" />
                      {item.name}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </li>
        </ul>
      </nav>
    </div>
  );

  return (
    <>
      {/* Mobile sidebar */}
      <Transition.Root show={open} as={Fragment}>
        <Dialog as="div" className="relative z-50 lg:hidden" onClose={onClose}>
          <Transition.Child
            as={Fragment}
            enter="transition-opacity ease-linear duration-300"
            enterFrom="opacity-0"
            enterTo="opacity-100"
            leave="transition-opacity ease-linear duration-300"
            leaveFrom="opacity-100"
            leaveTo="opacity-0"
          >
            <div className="fixed inset-0 bg-gray-900/80" />
          </Transition.Child>

          <div className="fixed inset-0 flex">
            <Transition.Child
              as={Fragment}
              enter="transition ease-in-out duration-300 transform"
              enterFrom="-translate-x-full"
              enterTo="translate-x-0"
              leave="transition ease-in-out duration-300 transform"
              leaveFrom="translate-x-0"
              leaveTo="-translate-x-full"
            >
              <Dialog.Panel className="relative mr-16 flex w-full max-w-xs flex-1">
                <Transition.Child
                  as={Fragment}
                  enter="ease-in-out duration-300"
                  enterFrom="opacity-0"
                  enterTo="opacity-100"
                  leave="ease-in-out duration-300"
                  leaveFrom="opacity-100"
                  leaveTo="opacity-0"
                >
                  <div className="absolute left-full top-0 flex w-16 justify-center pt-5">
                    <button
                      type="button"
                      className="-m-2.5 p-2.5"
                      onClick={onClose}
                    >
                      <XMarkIcon className="h-6 w-6 text-white" />
                    </button>
                  </div>
                </Transition.Child>
                <SidebarContent />
              </Dialog.Panel>
            </Transition.Child>
          </div>
        </Dialog>
      </Transition.Root>

      {/* Desktop sidebar */}
      <div className="hidden lg:fixed lg:inset-y-0 lg:z-50 lg:flex lg:w-72 lg:flex-col">
        <SidebarContent />
      </div>
    </>
  );
}