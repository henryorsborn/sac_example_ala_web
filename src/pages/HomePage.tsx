import { useState, useEffect, useCallback, useRef } from 'react';

interface Alias {
  alias_id: number;
  alias_url: string;
  redirect_uri: string;
  created_datetime_utc: Date;
  last_modified_date_time_utc: Date;
  last_used_date_time_utc: Date;
}

interface CreateAliasResponse {
  alias_id: number;
  alias_url: string;
  redirect_uri: string;
}

interface ResponseWrapper {
  count: number;
  values: Alias[];
}

interface AliasFormData {
  alias_url: string;
  redirect_uri: string;
}

export default function HomePage() {

  const [aliases, setAliases] = useState<Alias[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState<AliasFormData>({
    alias_url: '',
    redirect_uri: '',
  });

  // useRef so the AbortController persists across renders without re-creating.
  const controllerRef = useRef<AbortController | null>(null);

  const fetchAliases = useCallback(async () => {
    // Cancel any in-flight request before starting a new one.
    controllerRef.current?.abort();
    const controller = new AbortController();
    controllerRef.current = controller;

    try {
      const response = await fetch('http://localhost:8080/v1/aliases', {
        signal: controller.signal,
      });
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }

      const responseWrapper: ResponseWrapper = await response.json();
      // Defensive: never trust the network shape.
      const data: Alias[] = responseWrapper.values ?? [];
      setAliases(data);
    } catch (err) {
      if (err instanceof Error && err.name !== 'AbortError') {
        setError(err.message || 'Something went wrong');
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchAliases();
    return () => controllerRef.current?.abort();
  }, [fetchAliases]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8080/v1/aliases', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) {
        throw new Error('Failed to submit form data');
      }

      const result: CreateAliasResponse = await response.json();
      console.log('Success:', result);

      // Clear the form fields on success.
      setFormData({ alias_url: '', redirect_uri: '' });

      // Re-fetch the alias list so the table updates without a page reload.
      await fetchAliases();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  function renderForm() {
    return <div style={{ maxWidth: '400px', margin: '20px auto' }}>
      <h2>Create New Alias</h2>

      <form onSubmit={handleSubmit}>
        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="aliasuri" style={{ display: 'block', marginBottom: '5px' }}>AliasUrl:</label>
          <input
            type="text"
            id="aliasuri"
            name="alias_url"
            value={formData.alias_url}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        <div style={{ marginBottom: '15px' }}>
          <label htmlFor="redirecturi" style={{ display: 'block', marginBottom: '5px' }}>RedirectUri:</label>
          <input
            type="text"
            id="redirecturi"
            name="redirect_uri"
            value={formData.redirect_uri}
            onChange={handleChange}
            required
            style={{ width: '100%', padding: '8px' }}
          />
        </div>

        {error && <p style={{ color: 'red' }}>{error}</p>}

        <button type="submit" disabled={isLoading} style={{ padding: '10px 15px', cursor: 'pointer' }}>
          {isLoading ? 'Submitting...' : 'Submit'}
        </button>
      </form>
    </div>
  }

  function renderTable() {
    if (isLoading) return <div>Loading alias records...</div>;
    if (error) return <div>Error: {error}</div>;

    return <table>
        <thead>
          <tr>
            <th>AliasID</th>
            <th>AliasUrl</th>
            <th>RedirectUrl</th>
          </tr>
        </thead><tbody>
          {aliases.length === 0 ? (
            <tr>
              <td colSpan={4}>No users found.</td>
            </tr>
          ) : (
            aliases.map((alias) => (
              <tr key={alias.alias_id}>
                <td>{alias.alias_id}</td>
                <td>{alias.alias_url}</td>
                <td>{alias.redirect_uri}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
  }

  return (
    <section className="container py-12">
      <h1 className="text-3xl font-semibold tracking-tight">
        Welcome to {`ala_web`}
      </h1>
      <hr />
      <div>
        {renderForm()}
      <hr />
      </div><br></br>
        {renderTable()}
    </section>
  );
}