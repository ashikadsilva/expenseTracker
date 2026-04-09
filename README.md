# Expense Tracker React App

A comprehensive expense tracking application built with React that features data persistence, import/export capabilities, and category management.

## Features

- **5 Main Tabs**: Dashboard, Transactions, Categories, Manage Categories, and Import
- **Data Persistence**: All transactions and categories are saved to localStorage
- **XLSX Import**: Import transactions from Excel files using SheetJS
- **CSV Export**: Export all transactions to CSV format
- **Interactive Charts**: Visualize spending patterns with Chart.js
- **Category Management**: Create, edit, and delete custom expense and income categories
- **Responsive Design**: Matches the original design with exact color scheme and layout

## Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm start
```

3. Open http://localhost:3000 in your browser

## Usage

### Dashboard
- View total expenses, income, and net balance
- Filter by month and account
- Interactive donut chart for expense categories
- Monthly trend line chart
- Top spending categories with progress bars

### Transactions
- View all transactions with filtering options
- Filter by month, account, type, category, and search
- Add new transactions with the modal
- Edit or delete existing transactions
- Summary cards showing totals and counts

### Categories
- View expense breakdown by category
- Progress bars showing percentage of total spending
- Filter by month and account

### Manage Categories
- Create new expense or income categories
- Choose from predefined color palette
- Edit existing category names and colors
- Delete categories (transactions retain category names)

### Import
- Upload XLSX files containing transaction data
- Automatically reads sheets with "Transactions" in the name
- Supports both expense (columns B-E) and income (columns F-I) data
- Detects account from sheet name (Canara/Union)
- Skips duplicate transactions automatically

## Data Structure

### Transactions
```javascript
{
  id: number,
  date: "YYYY-MM-DD",
  desc: string,
  cat: string,
  amount: number,
  type: "expense" | "income",
  account: "Canara" | "Union"
}
```

### Categories
```javascript
{
  expense: [
    { name: string, color: string }
  ],
  income: [
    { name: string, color: string }
  ]
}
```

## Technology Stack

- **React 18**: Frontend framework
- **Chart.js**: Data visualization
- **SheetJS (XLSX)**: Excel file processing
- **localStorage**: Data persistence
- **CSS Variables**: Theming and styling

## File Structure

```
src/
  components/
    Dashboard.js          # Main dashboard with charts
    Transactions.js       # Transaction list and management
    CategoriesView.js     # Category breakdown view
    ManageCategories.js   # Category CRUD operations
    ImportTab.js          # XLSX import interface
    TransactionModal.js   # Add/edit transaction modal
    CategoryModal.js      # Add/edit category modal
  App.js                  # Main application component
  index.js               # Application entry point
  styles.css             # Complete styling matching original design
```

## Import Format

The import feature expects Excel files with:
- Sheet names containing "Transactions"
- Expense data in columns B-E (Date, Amount, Description, Category)
- Income data in columns F-I (Date, Amount, Description, Category)
- Account detected from sheet name (Canara/Union)
- First 4 rows are skipped (headers)

## Browser Support

- Chrome/Chromium
- Firefox
- Safari
- Edge

## Development

The application maintains the exact same design and functionality as the original HTML version while adding:
- React component architecture
- State management with hooks
- LocalStorage persistence
- Improved code organization
- Better maintainability
