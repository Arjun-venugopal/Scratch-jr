import '@testing-library/jest-dom';

jest.mock('uuid', () => ({
  v4: () => 'test-uuid-' + Math.random().toString(36).substring(2, 9),
}));
