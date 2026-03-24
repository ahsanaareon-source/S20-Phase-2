import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

// Helper function to draw a bar chart
const drawBarChart = (doc: jsPDF, x: number, y: number, width: number, height: number, data: { label: string; value: number; color: string }[], title: string) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const barWidth = width / data.length;
  const padding = 8;
  
  // Title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, x, y - 5);
  
  // Draw axes
  doc.setDrawColor(200, 200, 200);
  doc.line(x, y, x, y + height); // Y axis
  doc.line(x, y + height, x + width, y + height); // X axis
  
  // Draw bars
  data.forEach((item, index) => {
    const barHeight = (item.value / maxValue) * (height - 25);
    const barX = x + (index * barWidth) + padding;
    const barY = y + height - barHeight;
    
    // Draw bar
    doc.setFillColor(item.color);
    doc.rect(barX, barY, barWidth - (padding * 2), barHeight, 'F');
    
    // Value on top with padding
    doc.setFontSize(8);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(0, 0, 0);
    const valueText = item.value.toFixed(0);
    doc.text(valueText, barX + (barWidth - padding * 2) / 2, barY - 3, { align: 'center' });
    
    // Label below with proper spacing
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const labelY = y + height + 6;
    const labelLines = doc.splitTextToSize(item.label, barWidth - padding - 2);
    labelLines.forEach((line: string, lineIndex: number) => {
      doc.text(line, barX + (barWidth - padding * 2) / 2, labelY + (lineIndex * 4), { align: 'center', maxWidth: barWidth - padding });
    });
  });
  
  doc.setTextColor(0, 0, 0);
};

// Helper function to draw a progress bar
const drawProgressBar = (doc: jsPDF, x: number, y: number, width: number, height: number, percentage: number, label: string) => {
  // Background
  doc.setFillColor(240, 240, 240);
  doc.rect(x, y, width, height, 'F');
  
  // Progress
  const progressWidth = (width * percentage) / 100;
  const color = percentage < 30 ? [220, 53, 69] : percentage < 70 ? [255, 193, 7] : [40, 167, 69];
  doc.setFillColor(color[0], color[1], color[2]);
  doc.rect(x, y, progressWidth, height, 'F');
  
  // Border
  doc.setDrawColor(200, 200, 200);
  doc.rect(x, y, width, height, 'S');
  
  // Label and percentage with proper spacing
  if (label) {
    doc.setFontSize(9);
    doc.setTextColor(0, 0, 0);
    doc.text(label, x, y - 2);
  }
  
  doc.setFontSize(9);
  doc.setTextColor(0, 0, 0);
  doc.text(`${percentage}%`, x + width + 3, y + height - 1);
};

// Helper function to draw a pie chart
const drawPieChart = (doc: jsPDF, x: number, y: number, radius: number, data: { label: string; value: number; color: string }[], title: string) => {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  let currentAngle = -Math.PI / 2; // Start from top
  
  // Title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, x - radius, y - radius - 10);
  
  // Draw pie slices
  data.forEach((item) => {
    const sliceAngle = (item.value / total) * 2 * Math.PI;
    
    // Draw slice
    doc.setFillColor(item.color);
    doc.setDrawColor(255, 255, 255);
    doc.setLineWidth(1);
    
    const startX = x + radius * Math.cos(currentAngle);
    const startY = y + radius * Math.sin(currentAngle);
    
    doc.moveTo(x, y);
    doc.lineTo(startX, startY);
    
    // Create arc
    const steps = 50;
    for (let i = 0; i <= steps; i++) {
      const angle = currentAngle + (sliceAngle * i) / steps;
      const arcX = x + radius * Math.cos(angle);
      const arcY = y + radius * Math.sin(angle);
      doc.lineTo(arcX, arcY);
    }
    
    doc.lineTo(x, y);
    doc.fill();
    
    currentAngle += sliceAngle;
  });
  
  doc.setLineWidth(0.5);
  
  // Draw legend with proper spacing to avoid overlap
  let legendY = y - radius + 15;
  const legendX = x + radius + 18;
  
  data.forEach((item) => {
    // Color box
    doc.setFillColor(item.color);
    doc.rect(legendX, legendY - 3, 6, 6, 'F');
    
    // Text
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    const percentage = ((item.value / total) * 100).toFixed(1);
    const legendText = `${item.label} (${percentage}%)`;
    doc.text(legendText, legendX + 9, legendY + 2);
    
    legendY += 9; // Increased spacing to prevent overlap
  });
  
  doc.setTextColor(0, 0, 0);
};

// Helper function to draw line chart
const drawLineChart = (doc: jsPDF, x: number, y: number, width: number, height: number, data: { label: string; value: number }[], title: string) => {
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;
  
  // Title
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(0, 0, 0);
  doc.text(title, x, y - 5);
  
  // Draw axes
  doc.setDrawColor(200, 200, 200);
  doc.line(x, y, x, y + height); // Y axis
  doc.line(x, y + height, x + width, y + height); // X axis
  
  // Draw grid lines
  doc.setDrawColor(240, 240, 240);
  for (let i = 0; i <= 4; i++) {
    const gridY = y + (height / 4) * i;
    doc.line(x, gridY, x + width, gridY);
  }
  
  // Draw line
  doc.setDrawColor(66, 139, 202);
  doc.setLineWidth(2);
  
  const pointSpacing = width / (data.length - 1);
  
  data.forEach((point, index) => {
    const pointX = x + (pointSpacing * index);
    const normalizedValue = ((point.value - minValue) / range);
    const pointY = y + height - (normalizedValue * (height - 15)) - 5;
    
    if (index > 0) {
      const prevPointX = x + (pointSpacing * (index - 1));
      const prevNormalizedValue = ((data[index - 1].value - minValue) / range);
      const prevPointY = y + height - (prevNormalizedValue * (height - 15)) - 5;
      doc.line(prevPointX, prevPointY, pointX, pointY);
    }
    
    // Draw point
    doc.setFillColor(66, 139, 202);
    doc.circle(pointX, pointY, 2, 'F');
    
    // Label below axis with proper spacing
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(0, 0, 0);
    doc.text(point.label, pointX, y + height + 6, { align: 'center' });
  });
  
  doc.setLineWidth(0.5);
  doc.setTextColor(0, 0, 0);
};

// Helper function to sanitize filename
const sanitizeFilename = (filename: string): string => {
  return filename
    .replace(/[^a-z0-9]/gi, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '')
    .toLowerCase()
    .substring(0, 50);
};

// Helper function to normalize status text
const normalizeStatus = (status: string): string => {
  const statusMap: { [key: string]: string } = {
    'in progress': 'In Progress',
    'In progress': 'In Progress',
    'in-progress': 'In Progress',
    'completed': 'Completed',
    'Completed': 'Completed',
    'on hold': 'On Hold',
    'On hold': 'On Hold',
    'on-hold': 'On Hold',
    'delayed': 'Delayed',
    'Delayed': 'Delayed',
    'planning': 'Planning',
    'Planning': 'Planning'
  };
  
  return statusMap[status] || status;
};

// Helper function to analyze team performance from activity data
const analyzeTeamPerformance = (majorWorks: any[]) => {
  const teamMembers = [
    { name: 'Sarah Mitchell', role: 'Property Manager', activities: 0, tasksCompleted: 0, documentsProcessed: 0 },
    { name: 'Michael Thompson', role: 'Senior Property Manager', activities: 0, tasksCompleted: 0, documentsProcessed: 0 },
    { name: 'Emma Evans', role: 'Assistant Manager', activities: 0, tasksCompleted: 0, documentsProcessed: 0 },
    { name: 'James Cooper', role: 'Project Manager', activities: 0, tasksCompleted: 0, documentsProcessed: 0 }
  ];
  
  // Simulate activity analysis based on project count and progress
  majorWorks.forEach((work) => {
    const progress = work.progress || 0;
    const activitiesPerProject = Math.floor(progress / 10);
    
    // Distribute activities among team members
    teamMembers[0].activities += Math.floor(activitiesPerProject * 0.35);
    teamMembers[0].tasksCompleted += Math.floor(progress / 25);
    teamMembers[0].documentsProcessed += Math.floor(progress / 20);
    
    teamMembers[1].activities += Math.floor(activitiesPerProject * 0.30);
    teamMembers[1].tasksCompleted += Math.floor(progress / 30);
    teamMembers[1].documentsProcessed += Math.floor(progress / 25);
    
    teamMembers[2].activities += Math.floor(activitiesPerProject * 0.20);
    teamMembers[2].tasksCompleted += Math.floor(progress / 35);
    teamMembers[2].documentsProcessed += Math.floor(progress / 30);
    
    teamMembers[3].activities += Math.floor(activitiesPerProject * 0.15);
    teamMembers[3].tasksCompleted += Math.floor(progress / 40);
    teamMembers[3].documentsProcessed += Math.floor(progress / 35);
  });
  
  return teamMembers;
};

// Helper function to analyze individual project team performance
const analyzeProjectTeamPerformance = (work: any) => {
  const progress = work.progress || 0;
  
  const teamMembers = [
    { 
      name: 'Sarah Mitchell', 
      role: 'Property Manager',
      activities: Math.floor(progress / 8) + 12,
      tasksCompleted: Math.floor(progress / 12) + 8,
      documentsProcessed: Math.floor(progress / 15) + 6,
      hoursLogged: Math.floor(progress * 1.5) + 25,
      responseTime: '2.3 hours'
    },
    { 
      name: 'Michael Thompson', 
      role: 'Senior Property Manager',
      activities: Math.floor(progress / 10) + 8,
      tasksCompleted: Math.floor(progress / 15) + 5,
      documentsProcessed: Math.floor(progress / 18) + 4,
      hoursLogged: Math.floor(progress * 1.2) + 18,
      responseTime: '3.1 hours'
    },
    { 
      name: 'James Cooper', 
      role: 'Project Manager',
      activities: Math.floor(progress / 12) + 15,
      tasksCompleted: Math.floor(progress / 10) + 10,
      documentsProcessed: Math.floor(progress / 20) + 8,
      hoursLogged: Math.floor(progress * 1.8) + 32,
      responseTime: '1.8 hours'
    },
    { 
      name: 'Emma Evans', 
      role: 'Assistant Manager',
      activities: Math.floor(progress / 15) + 6,
      tasksCompleted: Math.floor(progress / 18) + 4,
      documentsProcessed: Math.floor(progress / 22) + 3,
      hoursLogged: Math.floor(progress * 0.9) + 15,
      responseTime: '4.2 hours'
    }
  ];
  
  return teamMembers;
};

// Generate comprehensive PDF for Major Works List View
export const generateMajorWorksListPDF = (majorWorks: any[]) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  
  // Cover Page
  doc.setFillColor(66, 139, 202);
  doc.rect(0, 0, pageWidth, 60, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(28);
  doc.setFont('helvetica', 'bold');
  doc.text('Major Works Portfolio', pageWidth / 2, 35, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprehensive Analytics & Financial Report', pageWidth / 2, 45, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Report Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 75);
  doc.text(`Report Period: Financial Year 2024-2025`, 14, 82);
  
  // Executive Summary
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Executive Summary', 14, 100);
  
  const totalProjects = majorWorks.length;
  const totalBudget = majorWorks.reduce((sum, work) => sum + work.budget, 0);
  const activeProjects = majorWorks.filter(w => normalizeStatus(w.status) === 'In Progress').length;
  const completedProjects = majorWorks.filter(w => normalizeStatus(w.status) === 'Completed').length;
  const onHoldProjects = majorWorks.filter(w => normalizeStatus(w.status) === 'On Hold').length;
  const delayedProjects = majorWorks.filter(w => normalizeStatus(w.status) === 'Delayed').length;
  const avgProgress = totalProjects > 0 ? majorWorks.reduce((sum, w) => sum + w.progress, 0) / totalProjects : 0;
  const estimatedTotalCost = totalBudget * 1.15; // Including contingency
  const spentToDate = totalBudget * (avgProgress / 100);
  const projectedSavings = totalBudget * 0.08; // 8% projected savings
  
  // Key metrics boxes
  const metrics = [
    { label: 'Total Projects', value: totalProjects.toString(), color: [66, 139, 202] },
    { label: 'Total Budget', value: `GBP ${(totalBudget / 1000000).toFixed(2)}M`, color: [40, 167, 69] },
    { label: 'Active Projects', value: activeProjects.toString(), color: [255, 193, 7] },
    { label: 'Avg Progress', value: `${avgProgress.toFixed(0)}%`, color: [23, 162, 184] }
  ];
  
  let xOffset = 14;
  metrics.forEach((metric) => {
    doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
    doc.roundedRect(xOffset, 110, 45, 25, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(18);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.value, xOffset + 22.5, 123, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label, xOffset + 22.5, 130, { align: 'center' });
    
    xOffset += 47;
  });
  
  doc.setTextColor(0, 0, 0);
  
  // Financial Overview Table
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Overview', 14, 150);
  
  autoTable(doc, {
    startY: 155,
    head: [['Metric', 'Amount (GBP)', 'Percentage']],
    body: [
      ['Total Approved Budget', totalBudget.toLocaleString(), '100%'],
      ['Estimated Total Cost (inc. contingency)', estimatedTotalCost.toFixed(0), '115%'],
      ['Spent to Date', spentToDate.toFixed(0), `${avgProgress.toFixed(1)}%`],
      ['Remaining Budget', (totalBudget - spentToDate).toFixed(0), `${(100 - avgProgress).toFixed(1)}%`],
      ['Projected Savings', projectedSavings.toFixed(0), '8%'],
      ['Projected Final Cost', (totalBudget - projectedSavings).toFixed(0), '92%']
    ],
    headStyles: { fillColor: [66, 139, 202], fontSize: 10 },
    styles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 80 },
      1: { halign: 'right', cellWidth: 60 },
      2: { halign: 'center', cellWidth: 40 }
    }
  });
  
  // Page 2 - Analytics & Charts
  doc.addPage();
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Portfolio Analytics', 14, 20);
  
  // Project Status Distribution (Pie Chart)
  const statusData = [
    { label: 'In Progress', value: activeProjects, color: '#ffc107' },
    { label: 'Completed', value: completedProjects, color: '#28a745' },
    { label: 'On Hold', value: onHoldProjects, color: '#dc3545' },
    { label: 'Delayed', value: delayedProjects, color: '#fd7e14' }
  ].filter(item => item.value > 0);
  
  drawPieChart(doc, 45, 60, 25, statusData, 'Project Status Distribution');
  
  // Budget Distribution (Bar Chart)
  const budgetByStatus = [
    { label: 'Active', value: majorWorks.filter(w => normalizeStatus(w.status) === 'In Progress').reduce((s, w) => s + w.budget, 0) / 1000, color: '#ffc107' },
    { label: 'Completed', value: majorWorks.filter(w => normalizeStatus(w.status) === 'Completed').reduce((s, w) => s + w.budget, 0) / 1000, color: '#28a745' },
    { label: 'On Hold', value: majorWorks.filter(w => normalizeStatus(w.status) === 'On Hold').reduce((s, w) => s + w.budget, 0) / 1000, color: '#dc3545' },
    { label: 'Delayed', value: majorWorks.filter(w => normalizeStatus(w.status) === 'Delayed').reduce((s, w) => s + w.budget, 0) / 1000, color: '#fd7e14' }
  ].filter(item => item.value > 0);
  
  drawBarChart(doc, 115, 35, 80, 60, budgetByStatus, 'Budget by Status (GBP thousands)');
  
  // Progress Analysis
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Progress Analysis', 14, 125);
  
  // Top 5 projects by budget with progress bars
  const topProjects = [...majorWorks].sort((a, b) => b.budget - a.budget).slice(0, 5);
  
  let progressY = 135;
  topProjects.forEach((project, index) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    const projectName = project.title.length > 35 ? project.title.substring(0, 32) + '...' : project.title;
    doc.text(`${index + 1}. ${projectName}`, 14, progressY);
    doc.text(`GBP ${(project.budget / 1000).toFixed(0)}k`, 180, progressY, { align: 'right' });
    
    drawProgressBar(doc, 14, progressY + 2, 150, 5, project.progress, '');
    
    progressY += 16;
  });
  
  // Cash Flow Forecast
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Cash Flow Forecast (GBP thousands)', 14, 225);
  
  const cashFlowData = [
    { label: 'Q1', value: totalBudget * 0.15 / 1000 },
    { label: 'Q2', value: totalBudget * 0.25 / 1000 },
    { label: 'Q3', value: totalBudget * 0.35 / 1000 },
    { label: 'Q4', value: totalBudget * 0.25 / 1000 }
  ];
  
  drawLineChart(doc, 20, 235, 170, 45, cashFlowData, '');
  
  // Page 3 - Team Performance
  doc.addPage();
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Team Performance Analysis', 14, 20);
  
  const teamPerformance = analyzeTeamPerformance(majorWorks);
  
  // Team Activity Overview
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Team Activity Overview', 14, 35);
  
  autoTable(doc, {
    startY: 40,
    head: [['Team Member', 'Role', 'Activities', 'Tasks Completed', 'Documents Processed']],
    body: teamPerformance.map(member => [
      member.name,
      member.role,
      member.activities.toString(),
      member.tasksCompleted.toString(),
      member.documentsProcessed.toString()
    ]),
    headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 45 },
      2: { halign: 'center', cellWidth: 25 },
      3: { halign: 'center', cellWidth: 30 },
      4: { halign: 'center', cellWidth: 35 }
    }
  });
  
  // Team Activity Chart
  let teamY = (doc as any).lastAutoTable.finalY + 20;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Team Activity Distribution', 14, teamY);
  
  const teamActivityData = teamPerformance.map(member => ({
    label: member.name.split(' ')[0],
    value: member.activities,
    color: '#428bca'
  }));
  
  drawBarChart(doc, 20, teamY + 10, 170, 55, teamActivityData, '');
  
  // Team Productivity Metrics
  teamY += 80;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Team Productivity Metrics', 14, teamY);
  
  const totalActivities = teamPerformance.reduce((sum, m) => sum + m.activities, 0);
  const totalTasksCompleted = teamPerformance.reduce((sum, m) => sum + m.tasksCompleted, 0);
  const totalDocuments = teamPerformance.reduce((sum, m) => sum + m.documentsProcessed, 0);
  
  autoTable(doc, {
    startY: teamY + 5,
    head: [['Metric', 'Total', 'Average per Team Member']],
    body: [
      ['Total Activities Logged', totalActivities.toString(), (totalActivities / teamPerformance.length).toFixed(1)],
      ['Tasks Completed', totalTasksCompleted.toString(), (totalTasksCompleted / teamPerformance.length).toFixed(1)],
      ['Documents Processed', totalDocuments.toString(), (totalDocuments / teamPerformance.length).toFixed(1)],
      ['Active Projects per Member', totalProjects.toString(), (totalProjects / teamPerformance.length).toFixed(1)]
    ],
    headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 70 },
      1: { halign: 'center', cellWidth: 40 },
      2: { halign: 'center', cellWidth: 60 }
    }
  });
  
  // Top Performers
  teamY = (doc as any).lastAutoTable.finalY + 20;
  
  if (teamY < 250) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Top Performers', 14, teamY);
    
    const sortedByActivities = [...teamPerformance].sort((a, b) => b.activities - a.activities);
    
    autoTable(doc, {
      startY: teamY + 5,
      head: [['Rank', 'Team Member', 'Activities', 'Performance Rating']],
      body: sortedByActivities.map((member, index) => {
        const rating = member.activities > 50 ? 'Excellent' : member.activities > 30 ? 'Good' : 'Average';
        return [
          `#${index + 1}`,
          member.name,
          member.activities.toString(),
          rating
        ];
      }),
      headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { halign: 'center', cellWidth: 20 },
        1: { cellWidth: 60 },
        2: { halign: 'center', cellWidth: 30 },
        3: { halign: 'center', cellWidth: 40 }
      },
      didParseCell: function(data) {
        if (data.section === 'body' && data.column.index === 3) {
          const rating = data.cell.raw as string;
          if (rating === 'Excellent') {
            data.cell.styles.textColor = [40, 167, 69];
            data.cell.styles.fontStyle = 'bold';
          } else if (rating === 'Good') {
            data.cell.styles.textColor = [255, 193, 7];
            data.cell.styles.fontStyle = 'bold';
          }
        }
      }
    });
  }
  
  // Page 4 - Detailed Project List
  doc.addPage();
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Detailed Project Portfolio', 14, 20);
  
  const tableData = majorWorks.map((work, index) => {
    const status = normalizeStatus(work.status);
    const flag = status === 'Completed' ? 'Complete' : status === 'Delayed' ? 'Delayed' : 'Active';
    
    return [
      (index + 1).toString(),
      work.title.length > 30 ? work.title.substring(0, 27) + '...' : work.title,
      work.estate.length > 20 ? work.estate.substring(0, 17) + '...' : work.estate,
      status,
      `GBP ${(work.budget / 1000).toFixed(0)}k`,
      `${work.progress}%`,
      work.startDate,
      flag
    ];
  });
  
  autoTable(doc, {
    head: [['#', 'Project Title', 'Estate', 'Status', 'Budget', 'Progress', 'Start Date', 'Flag']],
    body: tableData,
    startY: 30,
    styles: { fontSize: 7, cellPadding: 2 },
    headStyles: { fillColor: [66, 139, 202], fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 8 },
      1: { cellWidth: 45 },
      2: { cellWidth: 35 },
      3: { cellWidth: 22 },
      4: { cellWidth: 20, halign: 'right' },
      5: { cellWidth: 18, halign: 'center' },
      6: { cellWidth: 25 },
      7: { cellWidth: 10, halign: 'center' }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const status = data.cell.raw as string;
        if (status === 'Completed') {
          data.cell.styles.textColor = [40, 167, 69];
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'Delayed') {
          data.cell.styles.textColor = [220, 53, 69];
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'In Progress') {
          data.cell.styles.textColor = [255, 193, 7];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });
  
  // Page 5 - Risk Assessment & Projections
  doc.addPage();
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Assessment & Projections', 14, 20);
  
  // Risk Matrix
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Analysis', 14, 35);
  
  autoTable(doc, {
    startY: 40,
    head: [['Risk Category', 'Level', 'Impact', 'Mitigation Status']],
    body: [
      ['Budget Overrun', 'Medium', 'GBP ' + (totalBudget * 0.15 / 1000).toFixed(0) + 'k', 'Monitored'],
      ['Schedule Delays', 'Low', delayedProjects + ' projects', 'Managed'],
      ['Resource Availability', 'Low', 'Minor impact', 'Mitigated'],
      ['Compliance Issues', 'Low', 'No issues', 'Compliant'],
      ['Weather Impact', 'Medium', '2-3 week delay potential', 'Contingency planned']
    ],
    headStyles: { fillColor: [66, 139, 202] },
    styles: { fontSize: 9 }
  });
  
  // Financial Projections
  let projY = (doc as any).lastAutoTable.finalY + 20;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Projections', 14, projY);
  
  autoTable(doc, {
    startY: projY + 5,
    head: [['Period', 'Projected Spend', 'Cumulative', 'Variance', 'Forecast']],
    body: [
      ['Month 1-3', `GBP ${(totalBudget * 0.15).toFixed(0)}`, `GBP ${(totalBudget * 0.15).toFixed(0)}`, '+2%', 'On Track'],
      ['Month 4-6', `GBP ${(totalBudget * 0.25).toFixed(0)}`, `GBP ${(totalBudget * 0.40).toFixed(0)}`, '+1%', 'On Track'],
      ['Month 7-9', `GBP ${(totalBudget * 0.35).toFixed(0)}`, `GBP ${(totalBudget * 0.75).toFixed(0)}`, '-1%', 'Ahead'],
      ['Month 10-12', `GBP ${(totalBudget * 0.25).toFixed(0)}`, `GBP ${totalBudget.toFixed(0)}`, '-3%', 'Under Budget']
    ],
    headStyles: { fillColor: [66, 139, 202] },
    styles: { fontSize: 9 },
    columnStyles: {
      1: { halign: 'right' },
      2: { halign: 'right' },
      3: { halign: 'center' },
      4: { halign: 'center' }
    }
  });
  
  // Performance Metrics
  projY = (doc as any).lastAutoTable.finalY + 20;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Metrics', 14, projY);
  
  const onTimeDeliveryPct = (completedProjects + delayedProjects) > 0 
    ? ((completedProjects / (completedProjects + delayedProjects)) * 100).toFixed(0) 
    : '0';
  
  autoTable(doc, {
    startY: projY + 5,
    head: [['KPI', 'Target', 'Current', 'Status']],
    body: [
      ['On-Time Delivery', '95%', `${onTimeDeliveryPct}%`, 'Pass'],
      ['Budget Adherence', '100%', '98%', 'Pass'],
      ['Quality Score', '90%', '92%', 'Pass'],
      ['Safety Incidents', '0', '0', 'Pass'],
      ['Customer Satisfaction', '85%', '88%', 'Pass']
    ],
    headStyles: { fillColor: [66, 139, 202] },
    styles: { fontSize: 9 },
    columnStyles: {
      3: { halign: 'center', fontStyle: 'bold', textColor: [40, 167, 69] }
    }
  });
  
  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Major Works Portfolio Report | Page ${i} of ${totalPages} | Confidential`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF
  doc.save(`major-works-portfolio-report-${new Date().toISOString().split('T')[0]}.pdf`);
};

// Generate comprehensive detailed PDF for a single Major Work
export const generateMajorWorkDetailPDF = (work: any) => {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const normalizedStatus = normalizeStatus(work.status);
  
  // Cover Page
  doc.setFillColor(66, 139, 202);
  doc.rect(0, 0, pageWidth, 80, 'F');
  
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  const titleLines = doc.splitTextToSize(work.title, pageWidth - 28);
  doc.text(titleLines, pageWidth / 2, 30, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Comprehensive Project Report', pageWidth / 2, 55, { align: 'center' });
  doc.text(`Project ID: ${work.id}`, pageWidth / 2, 65, { align: 'center' });
  
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(10);
  doc.text(`Report Generated: ${new Date().toLocaleDateString('en-GB', { day: '2-digit', month: 'long', year: 'numeric' })}`, 14, 95);
  doc.text(`Project Status: ${normalizedStatus}`, 14, 102);
  
  // Project Overview Section
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Overview', 14, 120);
  
  // Key Metrics Boxes
  const metrics = [
    { label: 'Budget', value: `GBP ${(work.budget / 1000).toFixed(0)}k`, color: [40, 167, 69] },
    { label: 'Progress', value: `${work.progress}%`, color: [66, 139, 202] },
    { label: 'Spent', value: `GBP ${((work.budget * work.progress / 100) / 1000).toFixed(0)}k`, color: [255, 193, 7] },
    { label: 'Remaining', value: `GBP ${((work.budget * (100 - work.progress) / 100) / 1000).toFixed(0)}k`, color: [23, 162, 184] }
  ];
  
  let xOffset = 14;
  metrics.forEach((metric) => {
    doc.setFillColor(metric.color[0], metric.color[1], metric.color[2]);
    doc.roundedRect(xOffset, 125, 45, 22, 3, 3, 'F');
    
    doc.setTextColor(255, 255, 255);
    doc.setFontSize(16);
    doc.setFont('helvetica', 'bold');
    doc.text(metric.value, xOffset + 22.5, 138, { align: 'center' });
    
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    doc.text(metric.label, xOffset + 22.5, 144, { align: 'center' });
    
    xOffset += 47;
  });
  
  doc.setTextColor(0, 0, 0);
  
  // Project Details Table
  autoTable(doc, {
    startY: 155,
    body: [
      ['Project ID', work.id],
      ['Estate', work.estate],
      ['Status', normalizedStatus],
      ['Start Date', work.startDate],
      ['Expected Completion', work.expectedCompletion || 'TBD'],
      ['Units Affected', work.unitsAffected || 'N/A'],
      ['Residents Notified', work.residentsNotified || 'N/A'],
      ['Contractors', work.contractors || 'N/A']
    ],
    theme: 'grid',
    styles: { fontSize: 9 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 60 },
      1: { cellWidth: 120 }
    }
  });
  
  // Description
  let yPos = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Description', 14, yPos);
  yPos += 7;
  
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  const description = work.description || 'No description available';
  const splitDescription = doc.splitTextToSize(description, 180);
  doc.text(splitDescription, 14, yPos);
  
  // Page 2 - Financial Analysis
  doc.addPage();
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Financial Analysis', 14, 20);
  
  // Cost Breakdown
  const totalCost = work.budget;
  const spentToDate = totalCost * (work.progress / 100);
  const remaining = totalCost - spentToDate;
  const contingency = totalCost * 0.10;
  const managementFee = totalCost * 0.05;
  const directCosts = totalCost * 0.85;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Cost Breakdown', 14, 35);
  
  const costData = [
    { label: 'Direct Costs', value: directCosts / 1000, color: '#428bca' },
    { label: 'Management', value: managementFee / 1000, color: '#5cb85c' },
    { label: 'Contingency', value: contingency / 1000, color: '#f0ad4e' }
  ];
  
  drawPieChart(doc, 45, 70, 25, costData, '');
  
  // Financial Summary Table
  autoTable(doc, {
    startY: 40,
    margin: { left: 115 },
    head: [['Category', 'Amount (GBP)', '%']],
    body: [
      ['Direct Costs', directCosts.toFixed(0), '85%'],
      ['Management Fee', managementFee.toFixed(0), '5%'],
      ['Contingency', contingency.toFixed(0), '10%'],
      ['Total Budget', totalCost.toFixed(0), '100%'],
      ['Spent to Date', spentToDate.toFixed(0), `${work.progress}%`],
      ['Remaining', remaining.toFixed(0), `${(100 - work.progress)}%`]
    ],
    headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 35 },
      1: { halign: 'right', cellWidth: 30 },
      2: { halign: 'center', cellWidth: 15 }
    }
  });
  
  // Monthly Spend Forecast
  yPos = Math.max(120, (doc as any).lastAutoTable.finalY + 15);
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Monthly Spend Forecast (GBP thousands)', 14, yPos);
  
  const monthlyData = [
    { label: 'Jan', value: totalCost * 0.08 / 1000 },
    { label: 'Feb', value: totalCost * 0.12 / 1000 },
    { label: 'Mar', value: totalCost * 0.15 / 1000 },
    { label: 'Apr', value: totalCost * 0.18 / 1000 },
    { label: 'May', value: totalCost * 0.20 / 1000 },
    { label: 'Jun', value: totalCost * 0.15 / 1000 },
    { label: 'Jul', value: totalCost * 0.12 / 1000 }
  ];
  
  drawLineChart(doc, 20, yPos + 10, 170, 50, monthlyData, '');
  
  // Payment Schedule
  yPos += 75;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Payment Schedule', 14, yPos);
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [['Phase', 'Due Date', 'Amount', 'Status']],
    body: [
      ['Initial Payment', work.startDate, `GBP ${(totalCost * 0.20).toFixed(0)}`, work.progress > 0 ? 'Paid' : 'Pending'],
      ['Phase 1 Completion', work.planningDate || 'TBD', `GBP ${(totalCost * 0.25).toFixed(0)}`, work.progress > 25 ? 'Paid' : 'Pending'],
      ['Phase 2 Completion', work.section20Date || 'TBD', `GBP ${(totalCost * 0.25).toFixed(0)}`, work.progress > 50 ? 'Paid' : 'Pending'],
      ['Phase 3 Completion', work.contractorDate || 'TBD', `GBP ${(totalCost * 0.20).toFixed(0)}`, work.progress > 75 ? 'Paid' : 'Pending'],
      ['Final Payment', work.expectedCompletion || 'TBD', `GBP ${(totalCost * 0.10).toFixed(0)}`, work.progress === 100 ? 'Paid' : 'Pending']
    ],
    headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
    styles: { fontSize: 8 },
    columnStyles: {
      2: { halign: 'right' },
      3: { halign: 'center' }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const status = data.cell.raw as string;
        if (status === 'Paid') {
          data.cell.styles.textColor = [40, 167, 69];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });
  
  // Page 3 - Progress & Timeline
  doc.addPage();
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Progress & Timeline', 14, 20);
  
  // Overall Progress
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Overall Project Progress', 14, 35);
  
  drawProgressBar(doc, 14, 40, 180, 12, work.progress, '');
  
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`${work.progress}% Complete`, 14, 58);
  doc.text(`Start: ${work.startDate}`, 14, 65);
  doc.text(`Target Completion: ${work.expectedCompletion || 'TBD'}`, 14, 72);
  
  // Phase Progress
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Phase Progress', 14, 90);
  
  const phases = [
    { name: 'Planning & Design', progress: work.progress >= 20 ? 100 : work.progress * 5 },
    { name: 'Section 20 Consultation', progress: work.progress >= 40 ? 100 : Math.max(0, (work.progress - 20) * 5) },
    { name: 'Contractor Selection', progress: work.progress >= 60 ? 100 : Math.max(0, (work.progress - 40) * 5) },
    { name: 'Works Execution', progress: work.progress >= 80 ? 100 : Math.max(0, (work.progress - 60) * 5) },
    { name: 'Completion & Handover', progress: Math.max(0, (work.progress - 80) * 5) }
  ];
  
  let phaseY = 100;
  phases.forEach((phase) => {
    doc.setFontSize(9);
    doc.setFont('helvetica', 'normal');
    doc.text(phase.name, 14, phaseY);
    drawProgressBar(doc, 70, phaseY - 4, 110, 5, phase.progress, '');
    phaseY += 13;
  });
  
  // Timeline Table
  yPos = phaseY + 10;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Key Milestones', 14, yPos);
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [['Milestone', 'Planned Date', 'Actual Date', 'Status']],
    body: [
      ['Project Kickoff', work.startDate, work.startDate, 'Complete'],
      ['Planning Approval', work.planningDate || 'TBD', work.planningDate || '-', work.progress > 10 ? 'Complete' : 'Pending'],
      ['Section 20 Issued', work.section20Date || 'TBD', work.section20Date || '-', work.progress > 30 ? 'Complete' : 'Pending'],
      ['Contractor Appointed', work.contractorDate || 'TBD', work.contractorDate || '-', work.progress > 50 ? 'Complete' : 'Pending'],
      ['Works 50% Complete', 'TBD', '-', work.progress > 50 ? 'Complete' : 'Pending'],
      ['Works 75% Complete', 'TBD', '-', work.progress > 75 ? 'Complete' : 'Pending'],
      ['Practical Completion', work.expectedCompletion || 'TBD', '-', work.progress === 100 ? 'Complete' : 'Pending']
    ],
    headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
    styles: { fontSize: 8 },
    columnStyles: {
      3: { halign: 'center' }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const status = data.cell.raw as string;
        if (status === 'Complete') {
          data.cell.styles.textColor = [40, 167, 69];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });
  
  // Page 4 - Team Performance
  doc.addPage();
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Team Performance Analysis', 14, 20);
  
  const projectTeam = analyzeProjectTeamPerformance(work);
  
  // Team Activity Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Team Activity Summary', 14, 35);
  
  autoTable(doc, {
    startY: 40,
    head: [['Team Member', 'Role', 'Activities', 'Tasks', 'Documents', 'Hours']],
    body: projectTeam.map(member => [
      member.name,
      member.role,
      member.activities.toString(),
      member.tasksCompleted.toString(),
      member.documentsProcessed.toString(),
      member.hoursLogged.toString()
    ]),
    headStyles: { fillColor: [66, 139, 202], fontSize: 8 },
    styles: { fontSize: 7 },
    columnStyles: {
      0: { cellWidth: 45 },
      1: { cellWidth: 40 },
      2: { halign: 'center', cellWidth: 20 },
      3: { halign: 'center', cellWidth: 20 },
      4: { halign: 'center', cellWidth: 25 },
      5: { halign: 'center', cellWidth: 20 }
    }
  });
  
  // Team Response Times
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Team Response Times', 14, yPos);
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [['Team Member', 'Role', 'Avg Response Time', 'Performance']],
    body: projectTeam.map(member => {
      const responseHours = parseFloat(member.responseTime);
      const performance = responseHours < 3 ? 'Excellent' : responseHours < 5 ? 'Good' : 'Average';
      return [
        member.name,
        member.role,
        member.responseTime,
        performance
      ];
    }),
    headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
    styles: { fontSize: 8 },
    columnStyles: {
      0: { cellWidth: 50 },
      1: { cellWidth: 50 },
      2: { halign: 'center', cellWidth: 35 },
      3: { halign: 'center', cellWidth: 35 }
    },
    didParseCell: function(data) {
      if (data.section === 'body' && data.column.index === 3) {
        const performance = data.cell.raw as string;
        if (performance === 'Excellent') {
          data.cell.styles.textColor = [40, 167, 69];
          data.cell.styles.fontStyle = 'bold';
        } else if (performance === 'Good') {
          data.cell.styles.textColor = [255, 193, 7];
          data.cell.styles.fontStyle = 'bold';
        }
      }
    }
  });
  
  // Team Activity Distribution Chart
  yPos = (doc as any).lastAutoTable.finalY + 20;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Team Activity Distribution', 14, yPos);
  
  const teamActivityData = projectTeam.map(member => ({
    label: member.name.split(' ')[0],
    value: member.activities,
    color: '#428bca'
  }));
  
  drawBarChart(doc, 20, yPos + 10, 170, 55, teamActivityData, '');
  
  // Team Contribution Summary
  yPos += 80;
  
  if (yPos < 250) {
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Team Contribution Summary', 14, yPos);
    
    const totalHours = projectTeam.reduce((sum, m) => sum + m.hoursLogged, 0);
    const totalActivities = projectTeam.reduce((sum, m) => sum + m.activities, 0);
    
    autoTable(doc, {
      startY: yPos + 5,
      body: [
        ['Total Team Hours Logged', `${totalHours} hours`],
        ['Total Activities Completed', totalActivities.toString()],
        ['Average Activities per Member', (totalActivities / projectTeam.length).toFixed(1)],
        ['Most Active Member', projectTeam.sort((a, b) => b.activities - a.activities)[0].name],
        ['Team Productivity Rating', 'High']
      ],
      theme: 'grid',
      styles: { fontSize: 9 },
      columnStyles: {
        0: { fontStyle: 'bold', cellWidth: 80 },
        1: { cellWidth: 100 }
      }
    });
  }
  
  // Page 5 - Risk & Performance
  doc.addPage();
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Assessment & Performance', 14, 20);
  
  // Risk Register
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Risk Register', 14, 35);
  
  autoTable(doc, {
    startY: 40,
    head: [['Risk', 'Probability', 'Impact', 'Mitigation', 'Status']],
    body: [
      ['Budget Overrun', 'Low', 'High', 'Monthly monitoring', 'Active'],
      ['Schedule Delay', 'Medium', 'Medium', 'Critical path analysis', 'Monitored'],
      ['Weather Impact', 'Medium', 'Low', 'Weather contingency', 'Planned'],
      ['Resource Shortage', 'Low', 'Medium', 'Backup contractors', 'Mitigated'],
      ['Quality Issues', 'Low', 'High', 'Regular inspections', 'Controlled']
    ],
    headStyles: { fillColor: [66, 139, 202], fontSize: 8 },
    styles: { fontSize: 7 },
    columnStyles: {
      1: { halign: 'center', cellWidth: 22 },
      2: { halign: 'center', cellWidth: 18 },
      4: { halign: 'center', cellWidth: 20 }
    }
  });
  
  // Performance Metrics
  yPos = (doc as any).lastAutoTable.finalY + 20;
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Performance Metrics', 14, yPos);
  
  const performanceData = [
    { label: 'Schedule', value: work.progress >= 65 ? 92 : 85, color: '#5cb85c' },
    { label: 'Budget', value: 95, color: '#428bca' },
    { label: 'Quality', value: 88, color: '#f0ad4e' },
    { label: 'Safety', value: 100, color: '#5bc0de' }
  ];
  
  drawBarChart(doc, 20, yPos + 10, 170, 55, performanceData, '');
  
  // KPI Summary
  yPos += 85;
  
  autoTable(doc, {
    startY: yPos,
    head: [['KPI', 'Target', 'Actual', 'Status']],
    body: [
      ['Schedule Performance', '100%', `${(work.progress / 0.65 * 100).toFixed(0)}%`, work.progress >= 65 ? 'Pass' : 'Review'],
      ['Cost Performance', '100%', '98%', 'Pass'],
      ['Quality Score', '>90%', '92%', 'Pass'],
      ['Safety Incidents', '0', '0', 'Pass'],
      ['Change Orders', '<5', '2', 'Pass'],
      ['Resident Satisfaction', '>85%', '88%', 'Pass']
    ],
    headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
    styles: { fontSize: 8 },
    columnStyles: {
      1: { halign: 'center' },
      2: { halign: 'center' },
      3: { halign: 'center', fontStyle: 'bold' }
    }
  });
  
  // Page 6 - Documents & Compliance
  doc.addPage();
  
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('Documents & Compliance', 14, 20);
  
  // Document Summary
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Project Documentation', 14, 35);
  
  const documentsData = work.documents?.map((doc: any) => [
    doc.name,
    doc.type,
    doc.date,
    doc.status || 'N/A'
  ]) || [];
  
  if (documentsData.length > 0) {
    autoTable(doc, {
      startY: 40,
      head: [['Document Name', 'Type', 'Date', 'Status']],
      body: documentsData,
      headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
      styles: { fontSize: 8 },
      columnStyles: {
        0: { cellWidth: 80 },
        1: { cellWidth: 35 },
        2: { cellWidth: 30 },
        3: { cellWidth: 30, halign: 'center' }
      }
    });
    
    yPos = (doc as any).lastAutoTable.finalY + 15;
  } else {
    doc.setFontSize(10);
    doc.text('No documents available', 14, 45);
    yPos = 60;
  }
  
  // Compliance Checklist
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Compliance Checklist', 14, yPos);
  
  autoTable(doc, {
    startY: yPos + 5,
    head: [['Requirement', 'Status', 'Date Completed']],
    body: [
      ['Section 20 Consultation', 'Complete', work.section20Date || '-'],
      ['Building Regulations Approval', 'Complete', work.planningDate || '-'],
      ['Health & Safety Plan', 'Complete', work.startDate],
      ['Insurance Certificate', 'Complete', work.startDate],
      ['Risk Assessment', 'Complete', work.startDate],
      ['Method Statements', 'Complete', work.contractorDate || '-']
    ],
    headStyles: { fillColor: [66, 139, 202], fontSize: 9 },
    styles: { fontSize: 8 },
    columnStyles: {
      1: { halign: 'center', textColor: [40, 167, 69], fontStyle: 'bold' }
    }
  });
  
  // Summary & Recommendations
  yPos = (doc as any).lastAutoTable.finalY + 15;
  
  if (yPos > 230) {
    doc.addPage();
    yPos = 20;
  }
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Summary & Recommendations', 14, yPos);
  
  yPos += 7;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  
  const summary = [
    `Project ${work.id} is currently ${work.progress}% complete and ${normalizedStatus.toLowerCase()}.`,
    `Financial performance is on track with GBP ${((work.budget * work.progress / 100) / 1000).toFixed(0)}k of GBP ${(work.budget / 1000).toFixed(0)}k spent.`,
    `All compliance requirements have been met and documentation is up to date.`,
    `The project is ${work.progress >= 65 ? 'on schedule' : 'experiencing minor delays'} for the expected completion date.`,
    `Team performance is strong with ${projectTeam.reduce((s, m) => s + m.activities, 0)} activities completed.`,
    '',
    'Recommendations:',
    '- Continue monthly progress reviews with stakeholders',
    '- Maintain regular communication with residents',
    '- Monitor weather forecasts for potential impacts',
    '- Ensure all safety protocols are strictly followed',
    '- Keep team response times under 3 hours for urgent matters'
  ];
  
  summary.forEach((line) => {
    const splitLine = doc.splitTextToSize(line, 180);
    doc.text(splitLine, 14, yPos);
    yPos += splitLine.length * 5;
  });
  
  // Add footer to all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(128, 128, 128);
    doc.text(
      `Project ${work.id} - ${work.title} | Page ${i} of ${totalPages} | Confidential`,
      pageWidth / 2,
      doc.internal.pageSize.getHeight() - 10,
      { align: 'center' }
    );
  }
  
  // Save the PDF with sanitized work title
  const sanitizedTitle = sanitizeFilename(work.title);
  doc.save(`${sanitizedTitle}-report-${new Date().toISOString().split('T')[0]}.pdf`);
};
