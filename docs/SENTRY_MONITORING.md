# Sentry Monitoring for Authentication Issues

## Overview
This application now includes comprehensive Sentry monitoring specifically designed to debug authentication issues like infinite loading, session problems, and profile fetch errors.

## What's Being Tracked

### 1. **Authentication Events**
- `sign_up_started` / `sign_up_success` / `sign_up_success_pending_confirmation`
- `sign_in_started` / `sign_in_success`
- `initial_session_started` / `initial_session_result` / `initial_session_completed`
- `profile_fetch_started` / `profile_fetch_success` / `profile_fetch_skipped`

### 2. **Performance Metrics**
- Authentication operation durations (sign up, sign in, profile fetch)
- Initial session loading time
- Profile fetch timeouts
- Emergency timeout triggers

### 3. **Error Tracking**
- Supabase authentication errors with context
- Profile fetch failures
- Network timeouts
- Loading state issues

### 4. **Loading State Monitoring**
- Loading started/completed events
- Emergency timeout triggers
- Long loading warnings (>10 seconds)

## How to Use Sentry for Debugging

### 1. **Access Your Sentry Dashboard**
- URL: https://sentry.io/organizations/shahriar-9s/projects/javascript-react/
- Project: `javascript-react`
- Organization: `shahriar-9s`

### 2. **Key Filters to Use**

#### Authentication Issues
```
tags.auth.error:true
```

#### Loading Problems
```
tags.auth.loading:timeout OR message:"Emergency timeout"
```

#### Profile Fetch Issues
```
tags.auth.event:profile_fetch_started AND level:error
```

#### Performance Issues
```
transaction:auth.* AND duration:>2000
```

### 3. **Debug Workflow**

1. **Reproduce the Issue**
   - Open the app at http://localhost:5174/
   - Watch the debug panel in bottom-right corner
   - Click the 📸 button to manually capture snapshots

2. **Check Sentry Dashboard**
   - Look for recent events with auth tags
   - Check breadcrumbs for the sequence of events
   - Review performance transactions for timing issues

3. **Analyze Context**
   - Each event includes authentication state context
   - User information (if available)
   - Browser/device information
   - Timing data for all operations

### 4. **Common Issues to Look For**

#### Infinite Loading
- Look for `emergency_timeout` events
- Check if `initial_session_completed` is never triggered
- Review profile fetch errors that might be blocking

#### Profile Fetch Failures
- Search for `profile_fetch_started` without corresponding success
- Check Supabase error codes in event details
- Look for timeout patterns

#### Session Issues
- Look for `initial_session_result` with `hasSession: false`
- Check for repeated session fetch attempts
- Review token refresh errors

## Debug Panel Features

The enhanced debug panel now shows:

- **Local State**: Current React state values
- **Sentry State**: What's being sent to Sentry
- **State Matching**: Whether local and Sentry states align
- **Manual Snapshots**: Click 📸 to capture current state
- **Expandable Details**: Click ▶ to see Sentry-specific data

## Sentry Configuration

### Environment-Specific Monitoring
- **Development**: Full debug logging with detailed breadcrumbs
- **Production**: Focused on errors and performance issues
- **Sampling**: 100% trace sampling for complete visibility

### Custom Contexts
Each Sentry event includes:
```json
{
  "auth": {
    "hasUser": boolean,
    "hasProfile": boolean,
    "profileRole": string,
    "isLoading": boolean,
    "timestamp": string
  }
}
```

### Tags for Filtering
- `auth.status`: "authenticated" | "anonymous"
- `auth.role`: user role or "none"  
- `auth.loading`: "true" | "false"
- `auth.error`: "true" (for error events)
- `auth.event`: specific event name
- `auth.operation`: operation type
- `auth.session`: unique session ID

## Alerts & Monitoring

### Recommended Alerts
1. **High Error Rate**: >5 auth errors in 5 minutes
2. **Loading Timeouts**: Any emergency timeout triggers
3. **Performance Degradation**: Average auth operations >5 seconds
4. **User Impact**: Repeated sign-in failures for same user

### Dashboard Queries
1. **Authentication Success Rate**:
   ```
   sum(auth.sign_in_success) / sum(auth.sign_in_started) * 100
   ```

2. **Average Loading Time**:
   ```
   avg(transaction.duration) WHERE transaction.name:auth.*
   ```

3. **Profile Fetch Success Rate**:
   ```
   sum(auth.profile_fetch_success) / sum(auth.profile_fetch_started) * 100
   ```

## Troubleshooting Tips

1. **For Infinite Loading**:
   - Search for the specific session ID
   - Check the sequence: started → result → completed
   - Look for profile fetch blocking the flow

2. **For Authentication Failures**:
   - Review the full error context
   - Check network conditions during failure
   - Look for patterns across users/browsers

3. **For Performance Issues**:
   - Compare durations across operations
   - Check for network timeout patterns
   - Review concurrent operation conflicts

## Development Workflow

1. Start the app with Sentry enabled
2. Reproduce the issue while monitoring the debug panel
3. Capture manual snapshots at key moments
4. Review Sentry dashboard for detailed analysis
5. Use breadcrumbs to understand the event sequence
6. Check performance data for timing insights
