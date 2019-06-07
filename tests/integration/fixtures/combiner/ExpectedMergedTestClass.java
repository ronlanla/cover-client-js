package com.diffblue.javademo;

import com.diffblue.javademo.UserAccess;
import org.junit.Assert;
import org.junit.Rule;
import org.junit.Test;
import org.junit.rules.ExpectedException;
import org.junit.rules.Timeout;

import static org.mockito.AdditionalMatchers.or;
import static org.mockito.Matchers.anyInt;
import static org.mockito.Matchers.isA;
import static org.mockito.Matchers.isNull;

import com.diffblue.deeptestutils.Reflector;
import com.diffblue.deeptestutils.mock.DTUMemberMatcher;
import com.diffblue.javademo.serveraccess.DatabaseDao;
import com.mongodb.MongoClient;
import com.mongodb.client.MongoCollection;
import com.mongodb.client.MongoDatabase;
import org.bson.Document;
import org.bson.conversions.Bson;
import org.junit.runner.RunWith;
import org.powermock.api.mockito.PowerMockito;
import org.powermock.core.classloader.annotations.PrepareForTest;
import org.powermock.modules.junit4.PowerMockRunner;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;



@org.junit.runner.RunWith(org.powermock.modules.junit4.PowerMockRunner.class)
public class UserAccess {

  @Rule
  public final ExpectedException thrown = ExpectedException.none();

  @Rule
  public final Timeout globalTimeout = new Timeout(10000);

  /* testedClasses: UserAccessTest */

  /*
   * Test written by Diffblue Cover.
   * This test case covers:
   *  - conditional line 24 branch to line 24
   *  - conditional line 24 branch to line 25
   */

  @Test
  public void loginUserInputNotNullNotNullOutputFalse2() {

    // Arrange
    final UserAccess objectUnderTest = new UserAccess();
    final String username = "AAAAAAAA";
    final String password = "";

    // Act
    final boolean retval = objectUnderTest.loginUser(username, password);

    // Assert result
    Assert.assertEquals(false, retval);

  }

  /*
   * Test written by Diffblue Cover.
   * This test case covers:
   *  - conditional line 24 branch to line 24
   *  - conditional line 24 branch to line 28
   *  - conditional line 33 branch to line 38
   */
  @PrepareForTest({MongoDatabase.class, UserAccess.class, MongoCollection.class, Document.class, MongoClient.class, DatabaseDao.class})
  @Test
  public void loginUserInputNotNullNotNullOutputFalse() throws Exception, InvocationTargetException {

    // Arrange
    final UserAccess objectUnderTest = new UserAccess();
    final String username = "AAAAAAAA";
    final String password = " ";
    final MongoClient mongoClient = PowerMockito.mock(MongoClient.class);
    final MongoDatabase mongoDatabase = PowerMockito.mock(MongoDatabase.class);
    final MongoCollection mongoCollection = PowerMockito.mock(MongoCollection.class);
    final Method countMethod = DTUMemberMatcher.method(MongoCollection.class, "count", Bson.class);
    PowerMockito.doReturn(2_147_483_649L).when(mongoCollection, countMethod).withArguments(or(isA(Bson.class), isNull(Bson.class)));
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
    final boolean retval = objectUnderTest.loginUser(username, password);

    // Assert result
    Assert.assertEquals(false, retval);

  }

  /*
   * Test written by Diffblue Cover.
   * This test case covers:
   *  - conditional line 24 branch to line 24
   *  - conditional line 24 branch to line 28
   *  - conditional line 33 branch to line 34
   */
  @PrepareForTest({MongoDatabase.class, UserAccess.class, MongoCollection.class, Document.class, MongoClient.class, DatabaseDao.class})
  @Test
  public void loginUserInputNotNullNotNullOutputTrue() throws Exception, InvocationTargetException {

    // Arrange
    final UserAccess objectUnderTest = new UserAccess();
    final String username = "AAAAAAAA";
    final String password = " ";
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
    final boolean retval = objectUnderTest.loginUser(username, password);

    // Assert side effects
    Assert.assertEquals("AAAAAAAA", objectUnderTest.getCurrentUser());

    // Assert result
    Assert.assertEquals(true, retval);

  }
  /*
   * Test written by Diffblue Cover.
   * This test case covers:
   *  - conditional line 24 branch to line 25
   */

  @Test
  public void loginUserInputNotNullNullOutputFalse() {

    // Arrange
    final UserAccess objectUnderTest = new UserAccess();
    final String username = "";
    final String password = null;

    // Act
    final boolean retval = objectUnderTest.loginUser(username, password);

    // Assert result
    Assert.assertEquals(false, retval);

  }
}
