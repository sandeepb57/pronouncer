<?php

class Db {
    // The database connection
    protected static $connection;

    /**
     * Connect to the database
     *
     * @return bool false on failure / mysqli MySQLi object instance on success
     */
    public function connect() {
        // Try and connect to the database
        if(!isset(self::$connection)) {
            // Load configuration as an array. Use the actual location of your configuration file
            $config = parse_ini_file('dbconfig.ini');
            self::$connection = new mysqli($config['hostname'],$config['username'],$config['password'],$config['dbname']);
        }

        // If connection was not successful, handle the error
        if(self::$connection === false) {
            // Handle error - notify administrator, log to a file, show an error screen, etc.
            return false;
        }
        return self::$connection;
    }

    /**
     * Query the database
     *
     * @param $query The query string
     * @return mixed The result of the mysqli::query() function
     */
    public function query($query) {
        // Connect to the database
        $connection = $this -> connect();

        // Query the database
        $result = $connection -> query($query);

        return $result;
    }

		public function beginTransaction()
		{
			$connection = $this -> connect();
			return $connection -> begin_transaction();
		}

		public function commit()
		{
			$connection = $this -> connect();
			return $connection -> commit();
		}

		public function rollback()
		{
			$connection = $this -> connect();
			return $connection -> rollback();
		}


    /**
     * Fetch rows from the database (SELECT query)
     *
     * @param $query The query string
     * @return bool False on failure / array Database rows on success
     */
    public function select($query) {
        $result = $this -> query($query);
        if($result === false) {
            return false;
        }

		if($result -> num_rows>0)
		{
        while ($row = $result -> fetch_assoc()) {
            $rows[] = $row;
        }
			/* foreach($rows as $key=>$val)
			{
				$rows[$key]=$this->clean($val);
			} */
		}
		else
			$rows='';

        return $rows;
    }

	/*  return single row */
    public function selectone($query) {
        $result = $this -> query($query);
        if($result === false) {
            return false;
        }

		if($result -> num_rows>0)
		{
         $row = $result -> fetch_assoc();
            $rows[] = $row;
		}
		else
			$rows='';

        return $rows;
    }

	/*  insert record */
    public function insert($query) {
        $conn = $this -> connect();
        // Query the database
        $result = $conn -> query($query);
		$lastid=$conn->insert_id;
		return $lastid;
    }





    /**
     * Fetch the last error from the database
     *
     * @return string Database error message
     */
    public function error() {
        $connection = $this -> connect();
        return $connection -> error;
    }

    /**
     * Quote and escape value for use in a database query
     *
     * @param string $value The value to be quoted and escaped
     * @return string The quoted and escaped string
     */
    public function clean($data) {
        $connection = $this -> connect();
			$data = trim($data);
			$data = addslashes($data);
			$data = stripslashes($data);
			$data = htmlspecialchars($data);
            $data = $connection -> real_escape_string($data);

		return $data;

    }
}

?>