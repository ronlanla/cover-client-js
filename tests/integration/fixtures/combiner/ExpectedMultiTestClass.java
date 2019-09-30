package com.diffblue.javademo;

import static org.mockito.AdditionalMatchers.or;
import static org.mockito.Matchers.anyInt;
import static org.mockito.Matchers.isA;
import static org.mockito.Matchers.isNull;

import com.diffblue.deeptestutils.Reflector;
import com.diffblue.deeptestutils.mock.DTUMemberMatcher;
import com.diffblue.javademo.UserAccess;
import com.diffblue.javademo.serveraccess.DatabaseDao;
import com.mongodb.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.junit.Assert;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.rules.Timeout;
import org.junit.runner.RunWith;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;



@RunWith(PowerMockRunner.class)
public class UserAccessTest {

  @Rule
  public final Timeout globalTimeout = new Timeout(10000);

  // Test written by Diffblue Cover.
  @PrepareForTest({MongoDatabase.class, UserAccess.class, MongoCollection.class, Document.class, MongoClient.class, DatabaseDao.class})
  @Test
  public void loginUserInputNotNullNotNullOutputFalse2() throws Exception, InvocationTargetException {

    // Arrange
    final UserAccess userAccess = new UserAccess();
    Reflector.setField(userAccess, "currentUser", null);
    final String username = "?";
    final String password = "?";
    final MongoClient mongoClient = PowerMockito.mock(MongoClient.class);
    final MongoDatabase mongoDatabase = PowerMockito.mock(MongoDatabase.class);
    final MongoCollection mongoCollection = PowerMockito.mock(MongoCollection.class);
    final Method countMethod = DTUMemberMatcher.method(MongoCollection.class, "count", Bson.class);
    PowerMockito.doReturn(0L).when(mongoCollection, countMethod).withArguments(or(isA(Bson.class), isNull(Bson.class)));
    final Method getCollectionMethod = DTUMemberMatcher.method(MongoDatabase.class, "getCollection", String.class);
    PowerMockito.doReturn(mongoCollection).when(mongoDatabase, getCollectionMethod).withArguments(or(isA(String.class), isNull(String.class)));
    final Method getDatabaseMethod = DTUMemberMatcher.method(MongoClient.class, "getDatabase", String.class);
    PowerMockito.doReturn(mongoDatabase).when(mongoClient, getDatabaseMethod).withArguments(or(isA(String.class), isNull(String.class)));
    PowerMockito.whenNew(MongoClient.class).withParameterTypes(String.class, int.class).withArguments(or(isA(String.class), isNull(String.class)), anyInt()).thenReturn(mongoClient);
    final Document document = PowerMockito.mock(Document.class);
    final Document document1 = (Document) Reflector.getInstance("org.bson.Document");
    final Method appendMethod = DTUMemberMatcher.method(Document.class, "append", String.class, Object.class);
    PowerMockito.doReturn(document1).when(document, appendMethod).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class)));
    PowerMockito.whenNew(Document.class).withParameterTypes(String.class, Object.class).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class))).thenReturn(document);

    // Act
    final boolean actual = userAccess.loginUser(username, password);

    // Assert side effects
    Assert.assertNotNull(Reflector.getInstanceField(DatabaseDao.class, null, "instance"));

    // Assert result
    Assert.assertFalse(actual);

  }


  // Test written by Diffblue Cover.
  @Test
  public void loginUserInputNotNullNotNullOutputFalse3() {

    // Arrange
    final UserAccess userAccess = new UserAccess();

    // Act and Assert result
    Assert.assertFalse(userAccess.loginUser("?", ""));

  }

  // Test written by Diffblue Cover.
  @Test
  public void loginUserInputNotNullNotNullOutputFalse4() {

    // Arrange
    final UserAccess userAccess = new UserAccess();

    // Act and Assert result
    Assert.assertFalse(userAccess.loginUser("", "??"));

  }

  // Test written by Diffblue Cover.
  @PrepareForTest({MongoDatabase.class, UserAccess.class, MongoCollection.class, Document.class, MongoClient.class, DatabaseDao.class})
  @Test
  public void loginUserInputNotNullNotNullOutputTrue2() throws Exception, InvocationTargetException {

    // Arrange
    final UserAccess userAccess = new UserAccess();
    Reflector.setField(userAccess, "currentUser", null);
    final String username = "?";
    final String password = "??";
    final MongoClient mongoClient = PowerMockito.mock(MongoClient.class);
    final MongoDatabase mongoDatabase = PowerMockito.mock(MongoDatabase.class);
    final MongoCollection mongoCollection = PowerMockito.mock(MongoCollection.class);
    final Method countMethod = DTUMemberMatcher.method(MongoCollection.class, "count", Bson.class);
    PowerMockito.doReturn(1L).when(mongoCollection, countMethod).withArguments(or(isA(Bson.class), isNull(Bson.class)));
    final Method getCollectionMethod = DTUMemberMatcher.method(MongoDatabase.class, "getCollection", String.class);
    PowerMockito.doReturn(mongoCollection).when(mongoDatabase, getCollectionMethod).withArguments(or(isA(String.class), isNull(String.class)));
    final Method getDatabaseMethod = DTUMemberMatcher.method(MongoClient.class, "getDatabase", String.class);
    PowerMockito.doReturn(mongoDatabase).when(mongoClient, getDatabaseMethod).withArguments(or(isA(String.class), isNull(String.class)));
    PowerMockito.whenNew(MongoClient.class).withParameterTypes(String.class, int.class).withArguments(or(isA(String.class), isNull(String.class)), anyInt()).thenReturn(mongoClient);
    final Document document = PowerMockito.mock(Document.class);
    final Document document1 = (Document) Reflector.getInstance("org.bson.Document");
    final Method appendMethod = DTUMemberMatcher.method(Document.class, "append", String.class, Object.class);
    PowerMockito.doReturn(document1).when(document, appendMethod).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class)));
    PowerMockito.whenNew(Document.class).withParameterTypes(String.class, Object.class).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class))).thenReturn(document);

    // Act
    final boolean actual = userAccess.loginUser(username, password);

    // Assert side effects
    Assert.assertNotNull(Reflector.getInstanceField(DatabaseDao.class, null, "instance"));

    // Assert result
    Assert.assertTrue(actual);

  }


  // Test written by Diffblue Cover.
  @PrepareForTest({MongoDatabase.class, UserAccess.class, MongoCollection.class, Document.class, MongoClient.class, DatabaseDao.class})
  @Test
  public void loginUserInputNotNullNotNullOutputFalse5() throws Exception {

    // Arrange
    final UserAccess userAccess = new UserAccess();
    Reflector.setField(userAccess, "currentUser", null);
    final String username = "foo";
    final String password = "foo";
    final MongoClient mongoClient = PowerMockito.mock(MongoClient.class);
    final MongoDatabase mongoDatabase = PowerMockito.mock(MongoDatabase.class);
    final MongoCollection mongoCollection = PowerMockito.mock(MongoCollection.class);
    final Method countMethod = DTUMemberMatcher.method(MongoCollection.class, "count", Bson.class);
    PowerMockito.doReturn(0L).when(mongoCollection, countMethod).withArguments(or(isA(Bson.class), isNull(Bson.class)));
    final Method getCollectionMethod = DTUMemberMatcher.method(MongoDatabase.class, "getCollection", String.class);
    PowerMockito.doReturn(mongoCollection).when(mongoDatabase, getCollectionMethod).withArguments(or(isA(String.class), isNull(String.class)));
    final Method getDatabaseMethod = DTUMemberMatcher.method(MongoClient.class, "getDatabase", String.class);
    PowerMockito.doReturn(mongoDatabase).when(mongoClient, getDatabaseMethod).withArguments(or(isA(String.class), isNull(String.class)));
    PowerMockito.whenNew(MongoClient.class).withParameterTypes(String.class, int.class).withArguments(or(isA(String.class), isNull(String.class)), anyInt()).thenReturn(mongoClient);
    final Document document = PowerMockito.mock(Document.class);
    final Method appendMethod = DTUMemberMatcher.method(Document.class, "append", String.class, Object.class);
    PowerMockito.doReturn(null).when(document, appendMethod).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class)));
    PowerMockito.whenNew(Document.class).withParameterTypes(String.class, Object.class).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class))).thenReturn(document);

    // Act
    final boolean actual = userAccess.loginUser(username, password);

    // Assert side effects
    Assert.assertNotNull(Reflector.getInstanceField(DatabaseDao.class, null, "instance"));

    // Assert result
    Assert.assertFalse(actual);

  }


  // Test written by Diffblue Cover.
  @PrepareForTest({MongoDatabase.class, UserAccess.class, MongoCollection.class, Document.class, MongoClient.class, DatabaseDao.class})
  @Test
  public void loginUserInputNotNullNotNullOutputFalse4() throws Exception, InvocationTargetException {

    // Arrange
    final UserAccess userAccess = new UserAccess();
    Reflector.setField(userAccess, "currentUser", null);
    final String username = "foo";
    final String password = "foo";
    final MongoClient mongoClient = PowerMockito.mock(MongoClient.class);
    final MongoDatabase mongoDatabase = PowerMockito.mock(MongoDatabase.class);
    final MongoCollection mongoCollection = PowerMockito.mock(MongoCollection.class);
    final Method countMethod = DTUMemberMatcher.method(MongoCollection.class, "count", Bson.class);
    PowerMockito.doReturn(0L).when(mongoCollection, countMethod).withArguments(or(isA(Bson.class), isNull(Bson.class)));
    final Method getCollectionMethod = DTUMemberMatcher.method(MongoDatabase.class, "getCollection", String.class);
    PowerMockito.doReturn(mongoCollection).when(mongoDatabase, getCollectionMethod).withArguments(or(isA(String.class), isNull(String.class)));
    final Method getDatabaseMethod = DTUMemberMatcher.method(MongoClient.class, "getDatabase", String.class);
    PowerMockito.doReturn(mongoDatabase).when(mongoClient, getDatabaseMethod).withArguments(or(isA(String.class), isNull(String.class)));
    PowerMockito.whenNew(MongoClient.class).withParameterTypes(String.class, int.class).withArguments(or(isA(String.class), isNull(String.class)), anyInt()).thenReturn(mongoClient);
    final Document document = PowerMockito.mock(Document.class);
    final Document document1 = (Document) Reflector.getInstance("org.bson.Document");
    final Method appendMethod = DTUMemberMatcher.method(Document.class, "append", String.class, Object.class);
    PowerMockito.doReturn(document1).when(document, appendMethod).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class)));
    PowerMockito.whenNew(Document.class).withParameterTypes(String.class, Object.class).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class))).thenReturn(document);

    // Act
    final boolean actual = userAccess.loginUser(username, password);

    // Assert side effects
    Assert.assertNotNull(Reflector.getInstanceField(DatabaseDao.class, null, "instance"));

    // Assert result
    Assert.assertFalse(actual);

  }


  // Test written by Diffblue Cover.
  @PrepareForTest({MongoDatabase.class, UserAccess.class, MongoCollection.class, Document.class, MongoClient.class, DatabaseDao.class})
  @Test
  public void loginUserInputNotNullNotNullOutputFalse5() throws Exception {

    // Arrange
    final UserAccess userAccess = new UserAccess();
    Reflector.setField(userAccess, "currentUser", null);
    final String username = "?";
    final String password = "?";
    final MongoClient mongoClient = PowerMockito.mock(MongoClient.class);
    final MongoDatabase mongoDatabase = PowerMockito.mock(MongoDatabase.class);
    final MongoCollection mongoCollection = PowerMockito.mock(MongoCollection.class);
    final Method countMethod = DTUMemberMatcher.method(MongoCollection.class, "count", Bson.class);
    PowerMockito.doReturn(0L).when(mongoCollection, countMethod).withArguments(or(isA(Bson.class), isNull(Bson.class)));
    final Method getCollectionMethod = DTUMemberMatcher.method(MongoDatabase.class, "getCollection", String.class);
    PowerMockito.doReturn(mongoCollection).when(mongoDatabase, getCollectionMethod).withArguments(or(isA(String.class), isNull(String.class)));
    final Method getDatabaseMethod = DTUMemberMatcher.method(MongoClient.class, "getDatabase", String.class);
    PowerMockito.doReturn(mongoDatabase).when(mongoClient, getDatabaseMethod).withArguments(or(isA(String.class), isNull(String.class)));
    PowerMockito.whenNew(MongoClient.class).withParameterTypes(String.class, int.class).withArguments(or(isA(String.class), isNull(String.class)), anyInt()).thenReturn(mongoClient);
    final Document document = PowerMockito.mock(Document.class);
    final Method appendMethod = DTUMemberMatcher.method(Document.class, "append", String.class, Object.class);
    PowerMockito.doReturn(null).when(document, appendMethod).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class)));
    PowerMockito.whenNew(Document.class).withParameterTypes(String.class, Object.class).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class))).thenReturn(document);

    // Act
    final boolean actual = userAccess.loginUser(username, password);

    // Assert side effects
    Assert.assertNotNull(Reflector.getInstanceField(DatabaseDao.class, null, "instance"));

    // Assert result
    Assert.assertFalse(actual);

  }


  // Test written by Diffblue Cover.
  @Test
  public void loginUserInputNotNullNotNullOutputFalse9() {

    // Arrange
    final UserAccess userAccess = new UserAccess();
    Reflector.setField(userAccess, "currentUser", null);

    // Act and Assert result
    Assert.assertFalse(userAccess.loginUser("?", ""));

  }

  // Test written by Diffblue Cover.
  @PrepareForTest({MongoDatabase.class, UserAccess.class, MongoCollection.class, Document.class, MongoClient.class, DatabaseDao.class})
  @Test
  public void loginUserInputNotNullNotNullOutputFalse10() throws Exception {

    // Arrange
    final UserAccess userAccess = new UserAccess();
    Reflector.setField(userAccess, "currentUser", null);
    final String username = "?";
    final String password = "?";
    final MongoClient mongoClient = PowerMockito.mock(MongoClient.class);
    final MongoDatabase mongoDatabase = PowerMockito.mock(MongoDatabase.class);
    final MongoCollection mongoCollection = PowerMockito.mock(MongoCollection.class);
    final Method countMethod = DTUMemberMatcher.method(MongoCollection.class, "count", Bson.class);
    PowerMockito.doReturn(0L).when(mongoCollection, countMethod).withArguments(or(isA(Bson.class), isNull(Bson.class)));
    final Method getCollectionMethod = DTUMemberMatcher.method(MongoDatabase.class, "getCollection", String.class);
    PowerMockito.doReturn(mongoCollection).when(mongoDatabase, getCollectionMethod).withArguments(or(isA(String.class), isNull(String.class)));
    final Method getDatabaseMethod = DTUMemberMatcher.method(MongoClient.class, "getDatabase", String.class);
    PowerMockito.doReturn(mongoDatabase).when(mongoClient, getDatabaseMethod).withArguments(or(isA(String.class), isNull(String.class)));
    PowerMockito.whenNew(MongoClient.class).withParameterTypes(String.class, int.class).withArguments(or(isA(String.class), isNull(String.class)), anyInt()).thenReturn(mongoClient);
    final Document document = PowerMockito.mock(Document.class);
    final Method appendMethod = DTUMemberMatcher.method(Document.class, "append", String.class, Object.class);
    PowerMockito.doReturn(null).when(document, appendMethod).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class)));
    PowerMockito.whenNew(Document.class).withParameterTypes(String.class, Object.class).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class))).thenReturn(document);

    // Act
    final boolean actual = userAccess.loginUser(username, password);

    // Assert side effects
    Assert.assertNotNull(Reflector.getInstanceField(DatabaseDao.class, null, "instance"));

    // Assert result
    Assert.assertFalse(actual);

  }


  // Test written by Diffblue Cover.
  @Test
  public void loginUserInputNotNullNotNullOutputFalse8() {

    // Arrange
    final UserAccess userAccess = new UserAccess();
    Reflector.setField(userAccess, "currentUser", "");

    // Act and Assert result
    Assert.assertFalse(userAccess.loginUser("", "?"));

  }

  // Test written by Diffblue Cover.
  @Test
  public void loginUserInputNotNullNotNullOutputFalse9() {

    // Arrange
    final UserAccess userAccess = new UserAccess();
    Reflector.setField(userAccess, "currentUser", "");

    // Act and Assert result
    Assert.assertFalse(userAccess.loginUser("????????????????", ""));

  }

  // Test written by Diffblue Cover.
  @PrepareForTest({MongoDatabase.class, UserAccess.class, MongoCollection.class, Document.class, MongoClient.class, DatabaseDao.class})
  @Test
  public void loginUserInputNotNullNotNullOutputTrue1() throws Exception {

    // Arrange
    final UserAccess userAccess = new UserAccess();
    Reflector.setField(userAccess, "currentUser", null);
    final String username = "?";
    final String password = "?";
    final MongoClient mongoClient = PowerMockito.mock(MongoClient.class);
    final MongoDatabase mongoDatabase = PowerMockito.mock(MongoDatabase.class);
    final MongoCollection mongoCollection = PowerMockito.mock(MongoCollection.class);
    final Method countMethod = DTUMemberMatcher.method(MongoCollection.class, "count", Bson.class);
    PowerMockito.doReturn(1L).when(mongoCollection, countMethod).withArguments(or(isA(Bson.class), isNull(Bson.class)));
    final Method getCollectionMethod = DTUMemberMatcher.method(MongoDatabase.class, "getCollection", String.class);
    PowerMockito.doReturn(mongoCollection).when(mongoDatabase, getCollectionMethod).withArguments(or(isA(String.class), isNull(String.class)));
    final Method getDatabaseMethod = DTUMemberMatcher.method(MongoClient.class, "getDatabase", String.class);
    PowerMockito.doReturn(mongoDatabase).when(mongoClient, getDatabaseMethod).withArguments(or(isA(String.class), isNull(String.class)));
    PowerMockito.whenNew(MongoClient.class).withParameterTypes(String.class, int.class).withArguments(or(isA(String.class), isNull(String.class)), anyInt()).thenReturn(mongoClient);
    final Document document = PowerMockito.mock(Document.class);
    final Method appendMethod = DTUMemberMatcher.method(Document.class, "append", String.class, Object.class);
    PowerMockito.doReturn(null).when(document, appendMethod).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class)));
    PowerMockito.whenNew(Document.class).withParameterTypes(String.class, Object.class).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class))).thenReturn(document);

    // Act
    final boolean actual = userAccess.loginUser(username, password);

    // Assert side effects
    Assert.assertNotNull(Reflector.getInstanceField(DatabaseDao.class, null, "instance"));

    // Assert result
    Assert.assertTrue(actual);

  }


  // Test written by Diffblue Cover.
  @PrepareForTest({MongoDatabase.class, UserAccess.class, MongoCollection.class, Document.class, MongoClient.class, DatabaseDao.class})
  @Test
  public void loginUserInputNotNullNotNullOutputTrue2() throws Exception, InvocationTargetException {

    // Arrange
    final UserAccess userAccess = new UserAccess();
    Reflector.setField(userAccess, "currentUser", null);
    final String username = "foo";
    final String password = "foo";
    final MongoClient mongoClient = PowerMockito.mock(MongoClient.class);
    final MongoDatabase mongoDatabase = PowerMockito.mock(MongoDatabase.class);
    final MongoCollection mongoCollection = PowerMockito.mock(MongoCollection.class);
    final Method countMethod = DTUMemberMatcher.method(MongoCollection.class, "count", Bson.class);
    PowerMockito.doReturn(1L).when(mongoCollection, countMethod).withArguments(or(isA(Bson.class), isNull(Bson.class)));
    final Method getCollectionMethod = DTUMemberMatcher.method(MongoDatabase.class, "getCollection", String.class);
    PowerMockito.doReturn(mongoCollection).when(mongoDatabase, getCollectionMethod).withArguments(or(isA(String.class), isNull(String.class)));
    final Method getDatabaseMethod = DTUMemberMatcher.method(MongoClient.class, "getDatabase", String.class);
    PowerMockito.doReturn(mongoDatabase).when(mongoClient, getDatabaseMethod).withArguments(or(isA(String.class), isNull(String.class)));
    PowerMockito.whenNew(MongoClient.class).withParameterTypes(String.class, int.class).withArguments(or(isA(String.class), isNull(String.class)), anyInt()).thenReturn(mongoClient);
    final Document document = PowerMockito.mock(Document.class);
    final Document document1 = (Document) Reflector.getInstance("org.bson.Document");
    final Method appendMethod = DTUMemberMatcher.method(Document.class, "append", String.class, Object.class);
    PowerMockito.doReturn(document1).when(document, appendMethod).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class)));
    PowerMockito.whenNew(Document.class).withParameterTypes(String.class, Object.class).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class))).thenReturn(document);

    // Act
    final boolean actual = userAccess.loginUser(username, password);

    // Assert side effects
    Assert.assertNotNull(Reflector.getInstanceField(DatabaseDao.class, null, "instance"));

    // Assert result
    Assert.assertTrue(actual);

  }


  // Test written by Diffblue Cover.
  @PrepareForTest({MongoDatabase.class, UserAccess.class, MongoCollection.class, Document.class, MongoClient.class, DatabaseDao.class})
  @Test
  public void loginUserInputNotNullNotNullOutputTrue3() throws Exception {

    // Arrange
    final UserAccess userAccess = new UserAccess();
    Reflector.setField(userAccess, "currentUser", null);
    final String username = "foo";
    final String password = "foo";
    final MongoClient mongoClient = PowerMockito.mock(MongoClient.class);
    final MongoDatabase mongoDatabase = PowerMockito.mock(MongoDatabase.class);
    final MongoCollection mongoCollection = PowerMockito.mock(MongoCollection.class);
    final Method countMethod = DTUMemberMatcher.method(MongoCollection.class, "count", Bson.class);
    PowerMockito.doReturn(1L).when(mongoCollection, countMethod).withArguments(or(isA(Bson.class), isNull(Bson.class)));
    final Method getCollectionMethod = DTUMemberMatcher.method(MongoDatabase.class, "getCollection", String.class);
    PowerMockito.doReturn(mongoCollection).when(mongoDatabase, getCollectionMethod).withArguments(or(isA(String.class), isNull(String.class)));
    final Method getDatabaseMethod = DTUMemberMatcher.method(MongoClient.class, "getDatabase", String.class);
    PowerMockito.doReturn(mongoDatabase).when(mongoClient, getDatabaseMethod).withArguments(or(isA(String.class), isNull(String.class)));
    PowerMockito.whenNew(MongoClient.class).withParameterTypes(String.class, int.class).withArguments(or(isA(String.class), isNull(String.class)), anyInt()).thenReturn(mongoClient);
    final Document document = PowerMockito.mock(Document.class);
    final Method appendMethod = DTUMemberMatcher.method(Document.class, "append", String.class, Object.class);
    PowerMockito.doReturn(null).when(document, appendMethod).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class)));
    PowerMockito.whenNew(Document.class).withParameterTypes(String.class, Object.class).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class))).thenReturn(document);

    // Act
    final boolean actual = userAccess.loginUser(username, password);

    // Assert side effects
    Assert.assertNotNull(Reflector.getInstanceField(DatabaseDao.class, null, "instance"));

    // Assert result
    Assert.assertTrue(actual);

  }


  // Test written by Diffblue Cover.
  @PrepareForTest({MongoDatabase.class, UserAccess.class, MongoCollection.class, Document.class, MongoClient.class, DatabaseDao.class})
  @Test
  public void loginUserInputNotNullNotNullOutputTrue5() throws Exception {

    // Arrange
    final UserAccess userAccess = new UserAccess();
    Reflector.setField(userAccess, "currentUser", null);
    final String username = "?";
    final String password = "?";
    final MongoClient mongoClient = PowerMockito.mock(MongoClient.class);
    final MongoDatabase mongoDatabase = PowerMockito.mock(MongoDatabase.class);
    final MongoCollection mongoCollection = PowerMockito.mock(MongoCollection.class);
    final Method countMethod = DTUMemberMatcher.method(MongoCollection.class, "count", Bson.class);
    PowerMockito.doReturn(1L).when(mongoCollection, countMethod).withArguments(or(isA(Bson.class), isNull(Bson.class)));
    final Method getCollectionMethod = DTUMemberMatcher.method(MongoDatabase.class, "getCollection", String.class);
    PowerMockito.doReturn(mongoCollection).when(mongoDatabase, getCollectionMethod).withArguments(or(isA(String.class), isNull(String.class)));
    final Method getDatabaseMethod = DTUMemberMatcher.method(MongoClient.class, "getDatabase", String.class);
    PowerMockito.doReturn(mongoDatabase).when(mongoClient, getDatabaseMethod).withArguments(or(isA(String.class), isNull(String.class)));
    PowerMockito.whenNew(MongoClient.class).withParameterTypes(String.class, int.class).withArguments(or(isA(String.class), isNull(String.class)), anyInt()).thenReturn(mongoClient);
    final Document document = PowerMockito.mock(Document.class);
    final Method appendMethod = DTUMemberMatcher.method(Document.class, "append", String.class, Object.class);
    PowerMockito.doReturn(null).when(document, appendMethod).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class)));
    PowerMockito.whenNew(Document.class).withParameterTypes(String.class, Object.class).withArguments(or(isA(String.class), isNull(String.class)), or(isA(Object.class), isNull(Object.class))).thenReturn(document);

    // Act
    final boolean actual = userAccess.loginUser(username, password);

    // Assert side effects
    Assert.assertNotNull(Reflector.getInstanceField(DatabaseDao.class, null, "instance"));

    // Assert result
    Assert.assertTrue(actual);

  }


  // Test written by Diffblue Cover.
  @Test
  public void loginUserInputNotNullNullOutputFalse() {

    // Arrange
    final UserAccess userAccess = new UserAccess();
    Reflector.setField(userAccess, "currentUser", null);

    // Act and Assert result
    Assert.assertFalse(userAccess.loginUser("", null));

  }
}
